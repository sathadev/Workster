const util = require('util');
const db = require('../config/db');

// ทำให้ db.query สามารถใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

/**
 * ดึงคำขอลาทั้งหมดพร้อมชื่อและตำแหน่ง
 */
exports.getAllLeaveRequests = async () => {
  const sql = `
    SELECT lw.*, e.emp_name, jp.jobpos_name
    FROM leavework lw
    JOIN employee e ON lw.emp_id = e.emp_id
    JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
    ORDER BY lw.leavework_daterequest DESC
  `;
  return await query(sql);
};

/**
 * เพิ่มคำขอลาใหม่
 */
exports.createLeaveRequest = async (data) => {
  const sql = `
    INSERT INTO leavework (leavework_datestart, leavework_end, leavework_daterequest, leavework_description, emp_id, leaveworktype_id)
    VALUES (?, ?, NOW(), ?, ?, ?)
  `;
  const values = [
    data.datestart,
    data.dateend,
    data.description,
    data.emp_id,
    data.leaveworktype_id
  ];
  return await query(sql, values);
};

/**
 * อัปเดตสถานะการลา
 */
exports.updateLeaveStatus = async (leavework_id, status) => {
  const sql = `UPDATE leavework SET leavework_status = ? WHERE leavework_id = ?`;
  return await query(sql, [status, leavework_id]);
};

/**
 * ดึงข้อมูลการลาตามรหัสพนักงาน
 */
exports.getLeaveByEmpId = async (emp_id) => {
  const sql = `SELECT * FROM leavework WHERE emp_id = ? ORDER BY leavework_daterequest DESC`;
  return await query(sql, [emp_id]);
};

/**
 * ดึงประเภทการลาทั้งหมด
 */
exports.getAllLeaveTypes = async () => {
  const sql = `SELECT * FROM leaveworktype ORDER BY leaveworktype_name ASC`;
  return await query(sql);
};

/**
 * ดึงจำนวนวันลาที่ได้รับการอนุมัติตามรหัสพนักงาน
 */
exports.getApprovedLeaveCountByEmpId = async (emp_id) => {
  const sql = `
    SELECT COUNT(*) AS approved_leave_count
    FROM leavework
    WHERE emp_id = ? AND leavework_status = 'approved'
  `;
  const results = await query(sql, [emp_id]);
  // คืนค่าเป็นตัวเลขจำนวนวันลาโดยตรง
  return results[0].approved_leave_count;
};