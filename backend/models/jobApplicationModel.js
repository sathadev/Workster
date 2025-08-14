// backend/models/jobApplicationModel.js
const query = require('../utils/db');

const APP_TABLE = 'job_applications';
const POST_TABLE = 'job_postings';

async function getTableColumns(table) {
  const rows = await query(`SHOW COLUMNS FROM ${table}`);
  return new Set(rows.map(r => r.Field));
}

function addIfExists(colsSet, cols, vals, params, name, value, { raw = false } = {}) {
  if (!colsSet.has(name)) return;
  cols.push(name);
  if (raw) {
    vals.push(value);
  } else {
    vals.push('?');
    params.push(value);
  }
}

function buildPositionExpr(postColsSet, alias = 'position_name') {
  const candidates = ['position_title', 'position_name', 'job_position', 'job_level', 'job_title'];
  const existing = candidates.filter(c => postColsSet.has(c)).map(c => `jp.${c}`);
  if (existing.length === 0) return `NULL AS ${alias}`;
  return `COALESCE(${existing.join(', ')}) AS ${alias}`;
}

function buildJobTitleExpr(postColsSet) {
  const candidates = ['job_title', 'title', 'position_title'];
  const existing = candidates.filter(c => postColsSet.has(c));
  if (existing.length === 0) return 'jp.job_posting_id AS job_title';
  return `jp.${existing[0]} AS job_title`;
}

// ✅ ตัวช่วยสร้าง expression สำหรับสถานะ finalized
function buildFinalizedExpr(appColsSet) {
  if (appColsSet.has('application_status')) {
    return `CASE WHEN ja.application_status IN ('hired','rejected') THEN 1 ELSE 0 END AS is_finalized`;
  }
  return `COALESCE((SELECT f.is_finalized FROM job_application_flags f WHERE f.application_id = ja.application_id LIMIT 1), 0) AS is_finalized`;
}

const JobApplicationModel = {
  create: async (data) => {
    const appCols = await getTableColumns(APP_TABLE);

    const cols = [];
    const vals = [];
    const params = [];

    addIfExists(appCols, cols, vals, params, 'job_posting_id', data.job_posting_id);
    addIfExists(appCols, cols, vals, params, 'applicant_name', data.applicant_name);
    addIfExists(appCols, cols, vals, params, 'applicant_email', data.applicant_email);
    addIfExists(appCols, cols, vals, params, 'applicant_phone', data.applicant_phone ?? null);
    addIfExists(appCols, cols, vals, params, 'resume_filepath', data.resume_filepath);
    addIfExists(appCols, cols, vals, params, 'other_links_text', data.other_links_text ?? null);
    addIfExists(appCols, cols, vals, params, 'cover_letter_text', data.cover_letter_text ?? null);
    addIfExists(appCols, cols, vals, params, 'expected_salary', data.expected_salary ?? null);
    addIfExists(appCols, cols, vals, params, 'available_start_date', data.available_start_date ?? null);
    addIfExists(appCols, cols, vals, params, 'consent_privacy', data.consent_privacy ? 1 : 0);

    if (appCols.has('application_status')) {
      addIfExists(appCols, cols, vals, params, 'application_status', data.application_status || 'pending');
    }
    if (appCols.has('created_at')) {
      addIfExists(appCols, cols, vals, params, 'created_at', 'NOW()', { raw: true });
    }

    const sql = `INSERT INTO ${APP_TABLE} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
    const result = await query(sql, params);
    const rows = await query(`SELECT * FROM ${APP_TABLE} WHERE application_id = ?`, [result.insertId]);
    return rows[0];
  },

  getById: async (id) => {
    const rows = await query(`SELECT * FROM ${APP_TABLE} WHERE application_id = ?`, [id]);
    return rows[0] || null;
  },

  // ✅ ใช้เช็คว่าถูก finalize แล้วหรือยัง
  isFinalized: async ({ applicationId, companyId }) => {
    const appCols = await getTableColumns(APP_TABLE);
    const finalizedExpr = buildFinalizedExpr(appCols);
    const rows = await query(
      `
      SELECT ${finalizedExpr}
      FROM ${APP_TABLE} ja
      INNER JOIN ${POST_TABLE} jp ON jp.job_posting_id = ja.job_posting_id
      WHERE ja.application_id = ? AND jp.company_id = ?
      LIMIT 1
    `,
      [Number(applicationId), Number(companyId)]
    );
    if (rows.length === 0) return null; // ไม่ใช่ของบริษัทนี้/ไม่มีข้อมูล
    return rows[0].is_finalized === 1;
  },

  // ===== List by Company =====
  listByCompany: async ({ companyId, page = 1, pageSize = 10, q, status, jobPostingId }) => {
    const appCols = await getTableColumns(APP_TABLE);
    const postCols = await getTableColumns(POST_TABLE);

    const selectAppCols = [
      'ja.application_id',
      'ja.job_posting_id',
      'ja.applicant_name',
    ];
    if (appCols.has('application_status')) selectAppCols.push('ja.application_status');

    const jobTitleExpr = buildJobTitleExpr(postCols);
    const positionExpr = buildPositionExpr(postCols, 'position_name');
    const finalizedExpr = buildFinalizedExpr(appCols);

    const baseSelect = `
      SELECT ${selectAppCols.join(', ')},
             ${jobTitleExpr},
             ${positionExpr},
             ${finalizedExpr}
      FROM ${APP_TABLE} ja
      INNER JOIN ${POST_TABLE} jp ON jp.job_posting_id = ja.job_posting_id
    `;

    const where = ['jp.company_id = ?'];
    const params = [companyId];

    if (q) {
      const like = `LIKE CONCAT('%', ?, '%')`;
      const conds = [`ja.applicant_name ${like}`];
      if (postCols.has('job_title')) conds.push(`jp.job_title ${like}`);
      if (postCols.has('title')) conds.push(`jp.title ${like}`);
      if (postCols.has('position_title')) conds.push(`jp.position_title ${like}`);
      where.push(`(${conds.join(' OR ')})`);
      for (let i = 0; i < conds.length; i++) params.push(q);
    }

    if (jobPostingId) {
      where.push('ja.job_posting_id = ?');
      params.push(Number(jobPostingId));
    }

    if (status && appCols.has('application_status')) {
      where.push('ja.application_status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = appCols.has('created_at') ? 'ORDER BY ja.created_at DESC' : 'ORDER BY ja.application_id DESC';

    const limit = Math.max(1, Number(pageSize));
    const offset = Math.max(0, (Number(page) - 1) * limit);

    const sql = `${baseSelect} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`;
    const rows = await query(sql, [...params, limit, offset]);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM ${APP_TABLE} ja
      INNER JOIN ${POST_TABLE} jp ON jp.job_posting_id = ja.job_posting_id
      ${whereSql}
    `;
    const [{ total }] = await query(countSql, params);

    return { items: rows, page: Number(page), pageSize: limit, total: Number(total), totalPages: Math.ceil(total / limit) };
  },

  // ===== Detail by Company =====
  getDetailByCompany: async ({ applicationId, companyId }) => {
    const appCols = await getTableColumns(APP_TABLE);
    const postCols = await getTableColumns(POST_TABLE);

    const selectApp = [
      'ja.application_id',
      'ja.job_posting_id',
      'ja.applicant_name',
      'ja.applicant_email',
      'ja.applicant_phone',
      'ja.resume_filepath',
      'ja.other_links_text',
      'ja.cover_letter_text',
      'ja.expected_salary',
      'ja.available_start_date',
    ];
    if (appCols.has('application_status')) selectApp.push('ja.application_status');
    if (appCols.has('created_at')) selectApp.push('ja.created_at');

    const jobTitleExpr = buildJobTitleExpr(postCols);
    const positionExpr = buildPositionExpr(postCols, 'position_name');
    const finalizedExpr = buildFinalizedExpr(appCols);

    const sql = `
      SELECT ${selectApp.join(', ')},
             ${jobTitleExpr},
             ${positionExpr},
             ${finalizedExpr}
      FROM ${APP_TABLE} ja
      INNER JOIN ${POST_TABLE} jp ON jp.job_posting_id = ja.job_posting_id
      WHERE ja.application_id = ? AND jp.company_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [Number(applicationId), Number(companyId)]);
    return rows[0] || null;
  },

  // ===== Update Status =====
  updateStatusByCompany: async ({ applicationId, companyId, status }) => {
    const appCols = await getTableColumns(APP_TABLE);
    if (!appCols.has('application_status')) {
      const err = new Error('Column application_status does not exist.');
      err.code = 'NO_STATUS_COLUMN';
      throw err;
    }

    // ❗ ถ้า finalized แล้ว ไม่ให้แก้
    const finalized = await JobApplicationModel.isFinalized({ applicationId, companyId });
    if (finalized) {
      const e = new Error('Application already finalized.');
      e.code = 'ALREADY_FINALIZED';
      throw e;
    }

    const allow = new Set(['pending', 'reviewed', 'rejected', 'hired']);
    if (!allow.has(String(status))) {
      const err = new Error('Invalid application status.');
      err.code = 'BAD_STATUS';
      throw err;
    }

    const sql = `
      UPDATE ${APP_TABLE} ja
      INNER JOIN ${POST_TABLE} jp ON jp.job_posting_id = ja.job_posting_id
      SET ja.application_status = ?
      WHERE ja.application_id = ? AND jp.company_id = ?
      LIMIT 1
    `;
    const result = await query(sql, [status, applicationId, companyId]);
    if (result.affectedRows === 0) {
      const e = new Error('Application not found or not owned by company.');
      e.code = 'NOT_FOUND';
      throw e;
    }

    const rows = await query(
      `SELECT ja.*, jp.job_title FROM ${APP_TABLE} ja
       INNER JOIN ${POST_TABLE} jp ON jp.job_posting_id = ja.job_posting_id
       WHERE ja.application_id = ? LIMIT 1`,
      [applicationId]
    );
    return rows[0];
  },
};

module.exports = JobApplicationModel;
