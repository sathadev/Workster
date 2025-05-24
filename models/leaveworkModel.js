const db = require('../config/db');

// ดึงคำขอลาพร้อมชื่อ ตำแหน่ง
exports.getAllLeaveRequests = function(callback) {
  const sql = `
    SELECT lw.*, e.emp_name, jp.jobpos_name
    FROM leavework lw
    JOIN employee e ON lw.emp_id = e.emp_id
    JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
    ORDER BY lw.leavework_daterequest DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

// เพิ่มคำขอลาใหม่
exports.createLeaveRequest = function(data, callback) {
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

  db.query(sql, values, callback);
};

exports.updateLeaveStatus = function(leavework_id, status, callback) {
  const sql = `UPDATE leavework SET leavework_status = ? WHERE leavework_id = ?`;
  db.query(sql, [status, leavework_id], callback);
};

exports.getLeaveByEmpId = (emp_id, callback) => {
  const sql = `SELECT * FROM leavework WHERE emp_id = ? ORDER BY leavework_daterequest DESC`;
  db.query(sql, [emp_id], callback);
};
