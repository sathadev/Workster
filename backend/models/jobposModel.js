// backend/models/jobposModel.js
const query = require('../utils/db');

const Jobpos = {
  // Global + ของบริษัทตัวเอง / หรือ Global-only (public)
  getAll: async (companyId) => {
    if (companyId === undefined) {
      const error = new Error('companyId is required');
      error.statusCode = 400;
      throw error;
    }

    let sql = `SELECT * FROM jobpos`;
    const params = [];

    if (companyId === null) {
      // public: เห็นเฉพาะ Global
      sql += ` WHERE company_id IS NULL`;
    } else {
      // ผู้ใช้ทั่วไป: Global + ของบริษัทตัวเอง
      sql += ` WHERE company_id IS NULL OR company_id = ?`;
      params.push(companyId);
    }

    sql += ` ORDER BY jobpos_name`;
    return await query(sql, params);
  },

  // ค้นหาตาม id โดยมองเห็นได้เฉพาะ Global + ของบริษัทตัวเอง
  getById: async (id, companyId) => {
    if (companyId === undefined) {
      const error = new Error('companyId is required');
      error.statusCode = 400;
      throw error;
    }

    let sql = `SELECT * FROM jobpos WHERE jobpos_id = ?`;
    const params = [id];

    if (companyId === null) {
      // public: เฉพาะ Global
      sql += ` AND company_id IS NULL`;
    } else {
      // ผู้ใช้ทั่วไป: Global + ของบริษัทตัวเอง
      sql += ` AND (company_id IS NULL OR company_id = ?)`;
      params.push(companyId);
    }

    const rows = await query(sql, params);
    return rows[0] || null;
  },

  create: async (jobpos_name, companyId) => {
    const existing = await query(`
      SELECT jobpos_id
      FROM jobpos
      WHERE jobpos_name = ? AND (company_id = ? OR company_id IS NULL)
    `, [jobpos_name, companyId]);

    if (existing.length > 0) {
      const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือซ้ำกับตำแหน่ง Global');
      error.statusCode = 409;
      throw error;
    }

    const result = await query(
      `INSERT INTO jobpos (jobpos_name, company_id) VALUES (?, ?)`,
      [jobpos_name, companyId]
    );
    return await Jobpos.getById(result.insertId, companyId);
  },

  update: async (id, jobpos_name, companyId) => {
    const target = await Jobpos.getById(id, companyId);
    if (!target) {
      const error = new Error('ไม่พบตำแหน่งงานที่จะอัปเดต หรือคุณไม่มีสิทธิ์');
      error.statusCode = 404;
      throw error;
    }
    if (target.company_id === null) {
      const error = new Error('คุณไม่มีสิทธิ์แก้ไขตำแหน่งงาน Global');
      error.statusCode = 403;
      throw error;
    }

    const existing = await query(`
      SELECT jobpos_id
      FROM jobpos
      WHERE jobpos_name = ? AND (company_id = ? OR company_id IS NULL) AND jobpos_id != ?
    `, [jobpos_name, companyId, id]);

    if (existing.length > 0) {
      const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือซ้ำกับตำแหน่ง Global');
      error.statusCode = 409;
      throw error;
    }

    await query(
      `UPDATE jobpos SET jobpos_name = ? WHERE jobpos_id = ? AND company_id = ?`,
      [jobpos_name, id, companyId]
    );
    return await Jobpos.getById(id, companyId);
  },

  delete: async (id, companyId) => {
    const target = await Jobpos.getById(id, companyId);
    if (!target) {
      const error = new Error('ไม่พบตำแหน่งงานที่จะลบ หรือคุณไม่มีสิทธิ์');
      error.statusCode = 404;
      throw error;
    }
    if (target.company_id === null) {
      const error = new Error('ไม่สามารถลบตำแหน่งงาน Global ได้');
      error.statusCode = 403;
      throw error;
    }

    const result = await query(
      `DELETE FROM jobpos WHERE jobpos_id = ? AND company_id = ?`,
      [id, companyId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = Jobpos;
