// backend/models/leaveworkModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

const LeaveworkModel = {
  // ดึงคำขอลาทั้งหมดสำหรับ Admin/HR
  getAllLeaveRequests: async () => {
    const sql = `
      SELECT lw.*, e.emp_name, lt.leaveworktype_name, jp.jobpos_name
      FROM leavework lw
      JOIN employee e ON lw.emp_id = e.emp_id
      JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
      JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
      ORDER BY lw.leavework_daterequest DESC
    `;
    return await query(sql);
  },

  // ดึงคำขอลาเดียวด้วย ID ของคำขอ
  getLeaveRequestById: async (id) => {
    const sql = `
      SELECT lw.*, e.emp_name, lt.leaveworktype_name, jp.jobpos_name
      FROM leavework lw
      JOIN employee e ON lw.emp_id = e.emp_id
      JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
      JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
      WHERE lw.leavework_id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  },

  // สร้างคำขอลาใหม่
  createLeaveRequest: async (data) => {
    const sql = `
      INSERT INTO leavework (leavework_datestart, leavework_end, leavework_daterequest, leavework_description, emp_id, leaveworktype_id, leavework_status)
      VALUES (?, ?, NOW(), ?, ?, ?, 'pending')
    `;
    const values = [data.leavework_datestart, data.leavework_end, data.leavework_description, data.emp_id, data.leaveworktype_id];
    const result = await query(sql, values);
    return await LeaveworkModel.getLeaveRequestById(result.insertId);
  },

  // อัปเดตสถานะการลา (อนุมัติ/ปฏิเสธ)
  updateLeaveStatus: async (leavework_id, status) => {
    const sql = `UPDATE leavework SET leavework_status = ? WHERE leavework_id = ?`;
    await query(sql, [status, leavework_id]);
    return await LeaveworkModel.getLeaveRequestById(leavework_id);
  },

  // ดึงประวัติการลาทั้งหมดของพนักงานคนเดียว
  getLeaveByEmpId: async (emp_id) => {
    const sql = `
        SELECT lw.*, lt.leaveworktype_name 
        FROM leavework lw
        JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
        WHERE lw.emp_id = ? 
        ORDER BY lw.leavework_daterequest DESC
    `;
    return await query(sql, [emp_id]);
  },

  // ดึงประเภทการลาทั้งหมด
  getAllLeaveTypes: async () => {
    const sql = `SELECT * FROM leaveworktype ORDER BY leaveworktype_name ASC`;
    return await query(sql);
  },

  // ดึงจำนวนวันลาที่อนุมัติแล้ว (โค้ดเดิมดีอยู่แล้ว)
  getApprovedLeaveCountByEmpId: async (emp_id) => {
    const sql = `
      SELECT COUNT(*) AS approved_leave_count
      FROM leavework
      WHERE emp_id = ? AND leavework_status = 'approved'
    `;
    const results = await query(sql, [emp_id]);
    return results[0]?.approved_leave_count || 0;
  }
};

module.exports = LeaveworkModel;