// backend/models/jobposModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// --- แยก getById ออกมาเป็นฟังก์ชัน helper ---
const getById = async (id) => {
    const results = await query('SELECT * FROM jobpos WHERE jobpos_id = ?', [id]);
    return results[0] || null;
};

// --- สร้าง Object หลักสำหรับ Export ---
const Jobpos = {
  getAll: async () => {
    return await query('SELECT * FROM jobpos ORDER BY jobpos_id');
  },

  create: async (jobpos_name) => {
    const existing = await query('SELECT jobpos_id FROM jobpos WHERE jobpos_name = ?', [jobpos_name]);
    if (existing.length > 0) {
      const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้ว');
      error.statusCode = 409;
      throw error;
    }
    
    const sql = 'INSERT INTO jobpos (jobpos_name) VALUES (?)';
    const result = await query(sql, [jobpos_name]);
    
    // CHANGED: เรียกใช้ helper function โดยตรง
    return await getById(result.insertId);
  },

  update: async (id, jobpos_name) => {
    const sql = 'UPDATE jobpos SET jobpos_name = ? WHERE jobpos_id = ?';
    await query(sql, [jobpos_name, id]);
    // CHANGED: เรียกใช้ helper function โดยตรง
    return await getById(id);
  },

  delete: async (id) => {
    return await query('DELETE FROM jobpos WHERE jobpos_id = ?', [id]);
  },

  // Export helper function ไปด้วยเผื่อที่อื่นเรียกใช้
  getById: getById
};

module.exports = Jobpos;