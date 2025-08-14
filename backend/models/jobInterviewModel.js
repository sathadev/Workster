// backend/models/jobInterviewModel.js
const query = require('../utils/db');

const APP = 'job_applications';
const POST = 'job_postings';
const INT = 'job_interviews';

async function isOwnedByCompany(applicationId, companyId) {
  const rows = await query(
    `SELECT 1
     FROM ${APP} ja
     INNER JOIN ${POST} jp ON jp.job_posting_id = ja.job_posting_id
     WHERE ja.application_id = ? AND jp.company_id = ? LIMIT 1`,
    [applicationId, companyId]
  );
  return rows.length > 0;
}

async function listByApplication({ applicationId, companyId }) {
  // ตรวจสิทธิ์
  const ok = await isOwnedByCompany(applicationId, companyId);
  if (!ok) return null;

  const rows = await query(
    `SELECT interview_id, application_id, scheduled_at, method, location_or_link, notes, created_at
     FROM ${INT}
     WHERE application_id = ?
     ORDER BY scheduled_at DESC, interview_id DESC`,
    [applicationId]
  );
  return rows;
}

async function createForCompany({ applicationId, companyId, scheduled_at, method, location_or_link, notes }) {
  // ตรวจสิทธิ์
  const ok = await isOwnedByCompany(applicationId, companyId);
  if (!ok) return null;

  const result = await query(
    `INSERT INTO ${INT} (application_id, scheduled_at, method, location_or_link, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [applicationId, scheduled_at, method, location_or_link || null, notes || null]
  );

  const rows = await query(`SELECT * FROM ${INT} WHERE interview_id = ?`, [result.insertId]);
  return rows[0];
}

module.exports = { listByApplication, createForCompany };
