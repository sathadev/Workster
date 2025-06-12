const util = require('util');
const db = require('../db');

// Promisify the db.query function to use with async/await
const query = util.promisify(db.query).bind(db);

const Attendance = {
  /**
   * Gets the company's work time configuration.
   */
  getWorkTime: async () => {
    const sql = 'SELECT startwork, endwork, about_late FROM about LIMIT 1';
    const results = await query(sql);
    if (results.length === 0) {
      throw new Error("System configuration (about) not found.");
    }
    return results[0];
  },

  /**
   * Records a check-in for an employee.
   * Throws an error if already checked in today.
   */
  checkIn: async (emp_id) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // 1. Check if the user has already checked in today
    const checkSql = `
      SELECT 1 FROM attendance 
      WHERE emp_id = ? AND DATE(attendance_datetime) = ? AND attendance_type = 'checkin'
      LIMIT 1
    `;
    const existingCheckin = await query(checkSql, [emp_id, dateStr]);

    if (existingCheckin.length > 0) {
      throw new Error("You have already checked in today.");
    }

    // 2. Determine check-in status (ontime/late)
    const now = new Date();
    // Note: This logic is hardcoded to 09:00. It's better to use `startwork` from getWorkTime.
    // For now, I will keep the original logic.
    const hour = now.getHours();
    const minute = now.getMinutes();
    const status = hour < 9 || (hour === 9 && minute === 0) ? 'ontime' : 'late';

    // 3. Insert the new check-in record
    const insertSql = `
      INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
      VALUES (?, ?, ?, 'checkin')
    `;
    return await query(insertSql, [now, status, emp_id]);
  },

  /**
   * Records a check-out for an employee.
   */
  checkOut: async (emp_id, status) => {
    const now = new Date();
    const sql = `
      INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
      VALUES (?, ?, ?, 'checkout')
    `;
    return await query(sql, [now, status, emp_id]);
  },

  /**
   * Gets all attendance records for a specific employee for today.
   */
  getTodayAttendance: async (emp_id) => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sql = `
      SELECT * FROM attendance
      WHERE emp_id = ? AND DATE(attendance_datetime) = ?
      ORDER BY attendance_datetime
    `;
    return await query(sql, [emp_id, dateStr]);
  },

  /**
   * Gets a summary count of attendance statuses for a specific employee.
   */
  getCountSummary: async (emp_id) => {
    const sql = `
      SELECT attendance_status, attendance_type, COUNT(*) as count
      FROM attendance
      WHERE emp_id = ?
      GROUP BY attendance_status, attendance_type
    `;
    return await query(sql, [emp_id]);
  },

  /**
   * Gets the total number of unique employees who checked in today.
   */
  getTodayCheckinCount: async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sql = `
      SELECT COUNT(DISTINCT emp_id) AS count
      FROM attendance
      WHERE DATE(attendance_datetime) = ? AND attendance_type = 'checkin'
    `;
    const results = await query(sql, [dateStr]);
    // Return the count, or 0 if no results
    return results[0]?.count || 0;
  },

  /**
   * Gets a summary of today's attendance (ontime, late, absent).
   */
  getTodaySummary: async () => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const sql = `
      SELECT 
        SUM(CASE WHEN TIME(attendance_datetime) <= '09:00:00' THEN 1 ELSE 0 END) AS ontime,
        SUM(CASE WHEN TIME(attendance_datetime) > '09:00:00' THEN 1 ELSE 0 END) AS late,
        (SELECT COUNT(*) FROM employee) - COUNT(DISTINCT emp_id) AS absent
      FROM attendance
      WHERE DATE(attendance_datetime) = ? AND attendance_type = 'checkin'
    `;
    const results = await query(sql, [dateStr]);
    // Return the summary, or a default object if no results
    return results[0] || { ontime: 0, late: 0, absent: 0 };
  }
};

module.exports = Attendance;