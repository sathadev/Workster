const util = require('util');
const db = require('../config/db');

// ทำให้ db.query สามารถใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

const Jobpos = {
  /**
   * ดึงข้อมูลตำแหน่งงานทั้งหมด
   * @returns {Promise<Array>} รายการตำแหน่งงานทั้งหมด
   */
  getAll: async () => {
    // เพิ่มการเรียงลำดับตาม ID เพื่อให้ผลลัพธ์มีลำดับที่แน่นอน
    return await query('SELECT * FROM jobpos ORDER BY jobpos_id');
  },

  /**
   * ดึงข้อมูลตำแหน่งงานตาม ID
   * @param {number} id - ไอดีของตำแหน่งงาน
   * @returns {Promise<Array>} ข้อมูลตำแหน่งงาน
   */
  getById: async (id) => {
    return await query('SELECT * FROM jobpos WHERE jobpos_id = ?', [id]);
  },

  /**
   * สร้างตำแหน่งงานใหม่
   * @param {string} jobpos_name - ชื่อตำแหน่งงาน
   * @returns {Promise<object>} ผลลัพธ์จากการ INSERT
   */
  create: async (jobpos_name) => {
    const sql = 'INSERT INTO jobpos (jobpos_name) VALUES (?)';
    // หมายเหตุ: ในระบบจริง ควรมีการตรวจสอบชื่อตำแหน่งซ้ำก่อนทำการเพิ่มข้อมูล
    // เพื่อป้องกันข้อมูลที่ซ้ำซ้อนกันในฐานข้อมูล
    return await query(sql, [jobpos_name]);
  }
};

module.exports = Jobpos;