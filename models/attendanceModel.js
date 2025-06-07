const db = require('../db');

const Attendance = {
  getWorkTime: (callback) => {
    const sql = 'SELECT startwork, endwork, about_late FROM about LIMIT 1';
    db.query(sql, (err, results) => {
      if (err || results.length === 0) return callback(err || new Error("no about config"));
      callback(null, results[0]);
    });
  },

  checkIn: (emp_id, callback) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const checkSql = `
      SELECT 1 FROM attendance 
      WHERE emp_id = ? AND DATE(attendance_datetime) = ? AND attendance_type = 'checkin'
      LIMIT 1
    `;

    db.query(checkSql, [emp_id, dateStr], (err, results) => {
      if (err) return callback(err);
      if (results.length > 0) {
        return callback(new Error("เช็คอินไปแล้ว"));
      }

      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const status = hour < 9 || (hour === 9 && minute === 0) ? 'ontime' : 'late';

      const insertSql = `
        INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
        VALUES (?, ?, ?, 'checkin')
      `;
      db.query(insertSql, [now, status, emp_id], callback);
    });
  },

  checkOut: (emp_id, status, callback) => {
    const now = new Date();

    const sql = `
      INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
      VALUES (?, ?, ?, 'checkout')
    `;
    db.query(sql, [now, status, emp_id], callback);
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
  },

  getCountSummary: (emp_id, callback) => {
    const sql = `
      SELECT attendance_status, attendance_type, COUNT(*) as count
      FROM attendance
      WHERE emp_id = ?
      GROUP BY attendance_status, attendance_type
    `;
    db.query(sql, [emp_id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
};

module.exports = Attendance;
