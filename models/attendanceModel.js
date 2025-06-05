const db = require('../db');

const Attendance = {
  checkIn: (emp_id, callback) => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const status = hour < 9 || (hour === 9 && minute === 0) ? 'ontime' : 'late';

    const sql = `
      INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
      VALUES (?, ?, ?, 'checkin')
    `;
    db.query(sql, [now, status, emp_id], callback);
  },

  checkOut: (emp_id, callback) => {
    const now = new Date();

    const sql = `
      INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
      VALUES (?, NULL, ?, 'checkout')
    `;
    db.query(sql, [now, emp_id], callback);
  },

  getTodayAttendance: (emp_id, callback) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const sql = `
      SELECT * FROM attendance
      WHERE emp_id = ? AND DATE(attendance_datetime) = ?
      ORDER BY attendance_datetime
    `;
    db.query(sql, [emp_id, dateStr], callback);
  }
};

module.exports = Attendance;
