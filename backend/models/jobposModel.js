// backend/models/jobposModel.js
// โมเดลสำหรับจัดการข้อมูล "ตำแหน่งงาน (Job Positions)"
// ทำหน้าที่เชื่อมต่อฐานข้อมูล MySQL ผ่าน query() และควบคุมสิทธิ์ตาม companyId

const query = require('../utils/db');

const Jobpos = {
  // [GET] ดึงตำแหน่งงานทั้งหมด
  // ใช้ได้ทั้งกรณี: 
  //   - บริษัททั่วไป → เห็น Global + ของบริษัทตัวเอง
  //   - Public (ไม่มี companyId) → เห็นเฉพาะ Global
  getAll: async (companyId) => {
    // ป้องกันกรณีลืมส่ง companyId
    if (companyId === undefined) {
      const error = new Error('companyId is required');
      error.statusCode = 400;
      throw error;
    }

    let sql = `SELECT * FROM jobpos`;
    const params = [];

    if (companyId === null) {
      // โหมด public: เห็นเฉพาะ Global (ที่ company_id เป็น NULL)
      // และไม่รวมตำแหน่ง Super Admin (id = 0)
      sql += ` WHERE company_id IS NULL AND jobpos_id != 0`;
    } else {
      // โหมดบริษัททั่วไป: เห็น Global ทั้งหมด + ของบริษัทตัวเอง
      sql += ` WHERE (company_id IS NULL AND jobpos_id != 0) OR company_id = ?`;
      params.push(companyId);
    }

    sql += ` ORDER BY jobpos_name`; // เรียงตามชื่อ
    return await query(sql, params);
  },

  // [GET] ดึงตำแหน่งงานรายตัวด้วย jobpos_id
  // จำกัดสิทธิ์ให้เห็นได้เฉพาะ Global + ของบริษัทตัวเอง
  getById: async (id, companyId) => {
    if (companyId === undefined) {
      const error = new Error('companyId is required');
      error.statusCode = 400;
      throw error;
    }

    let sql = `SELECT * FROM jobpos WHERE jobpos_id = ?`;
    const params = [id];

    if (companyId === null) {
      // public เห็นเฉพาะ Global เท่านั้น
      sql += ` AND company_id IS NULL`;
    } else {
      // บริษัททั่วไป เห็น Global + ของบริษัทตัวเอง
      sql += ` AND (company_id IS NULL OR company_id = ?)`;
      params.push(companyId);
    }

    const rows = await query(sql, params);
    return rows[0] || null; // ถ้าไม่พบคืน null
  },

  // [POST] เพิ่มตำแหน่งงานใหม่ของบริษัท
  create: async (jobpos_name, companyId) => {
    // ตรวจสอบว่าชื่อซ้ำในบริษัทนี้หรือซ้ำกับตำแหน่ง Global หรือไม่
    const existing = await query(
      `
      SELECT jobpos_id
      FROM jobpos
      WHERE jobpos_name = ? AND (company_id = ? OR company_id IS NULL)
      `,
      [jobpos_name, companyId]
    );

    if (existing.length > 0) {
      const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือซ้ำกับตำแหน่ง Global');
      error.statusCode = 409; // Conflict
      throw error;
    }

    // เพิ่มข้อมูลใหม่
    const result = await query(
      `INSERT INTO jobpos (jobpos_name, company_id) VALUES (?, ?)`,
      [jobpos_name, companyId]
    );

    // คืนค่าข้อมูลที่เพิ่งสร้างใหม่
    return await Jobpos.getById(result.insertId, companyId);
  },

  // [PUT] แก้ไขข้อมูลตำแหน่งงาน
  update: async (id, jobpos_name, companyId) => {
    // ตรวจสอบว่ามีตำแหน่งนี้ในบริษัทหรือไม่
    const target = await Jobpos.getById(id, companyId);
    if (!target) {
      const error = new Error('ไม่พบตำแหน่งงานที่จะอัปเดต หรือคุณไม่มีสิทธิ์');
      error.statusCode = 404;
      throw error;
    }

    // ห้ามแก้ไขตำแหน่ง Global (เช่น "HR", "Admin")
    if (target.company_id === null) {
      const error = new Error('คุณไม่มีสิทธิ์แก้ไขตำแหน่งงาน Global');
      error.statusCode = 403;
      throw error;
    }

    // ตรวจสอบชื่อใหม่ว่าซ้ำกับตำแหน่งอื่นหรือไม่ (ในบริษัทหรือ Global)
    const existing = await query(
      `
      SELECT jobpos_id
      FROM jobpos
      WHERE jobpos_name = ? 
        AND (company_id = ? OR company_id IS NULL)
        AND jobpos_id != ?
      `,
      [jobpos_name, companyId, id]
    );

    if (existing.length > 0) {
      const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือซ้ำกับตำแหน่ง Global');
      error.statusCode = 409;
      throw error;
    }

    // อัปเดตชื่อใหม่
    await query(
      `UPDATE jobpos SET jobpos_name = ? WHERE jobpos_id = ? AND company_id = ?`,
      [jobpos_name, id, companyId]
    );

    // คืนค่าตำแหน่งที่อัปเดตแล้ว
    return await Jobpos.getById(id, companyId);
  },

  // [DELETE] ลบตำแหน่งงาน
  delete: async (id, companyId) => {
    // ตรวจสอบสิทธิ์ก่อนลบ
    const target = await Jobpos.getById(id, companyId);
    if (!target) {
      const error = new Error('ไม่พบตำแหน่งงานที่จะลบ หรือคุณไม่มีสิทธิ์');
      error.statusCode = 404;
      throw error;
    }

    // ห้ามลบตำแหน่ง Global
    if (target.company_id === null) {
      const error = new Error('ไม่สามารถลบตำแหน่งงาน Global ได้');
      error.statusCode = 403;
      throw error;
    }

    // ดำเนินการลบ
    const result = await query(
      `DELETE FROM jobpos WHERE jobpos_id = ? AND company_id = ?`,
      [id, companyId]
    );

    // คืน true ถ้าลบสำเร็จ
    return result.affectedRows > 0;
  },
};

module.exports = Jobpos;
