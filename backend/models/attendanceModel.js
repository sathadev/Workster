const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// --- ฟังก์ชัน helper ที่แยกออกมา ---
const getWorkTime = async () => {
    const sql = 'SELECT startwork, endwork FROM about LIMIT 1';
    const results = await query(sql);
    if (results.length === 0) {
        throw new Error("System configuration (about) not found.");
    }
    return results[0];
};

// --- Object หลักสำหรับ Export ---
const Attendance = {
    checkIn: async (emp_id) => {
        const checkSql = `
            SELECT 1 FROM attendance 
            WHERE emp_id = ? AND DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
            LIMIT 1
        `;
        const existingCheckin = await query(checkSql, [emp_id]);
        if (existingCheckin.length > 0) {
            throw new Error("You have already checked in today.");
        }

        const config = await getWorkTime(); // <-- เรียกใช้โดยตรง
        const [startHour, startMinute] = config.startwork.split(':').map(Number);
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let status = 'late';
        if (currentHour < startHour || (currentHour === startHour && currentMinute <= startMinute)) {
            status = 'ontime';
        }

        const insertSql = `
            INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
            VALUES (?, ?, ?, 'checkin')
        `;
        return await query(insertSql, [now, status, emp_id]);
    },

    checkOut: async (emp_id, status) => {
        const now = new Date();
        const sql = `
            INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type)
            VALUES (?, ?, ?, 'checkout')
        `;
        return await query(sql, [now, status, emp_id]);
    },

    getTodayAttendance: async (emp_id) => {
        const sql = `
            SELECT * FROM attendance
            WHERE emp_id = ? AND DATE(attendance_datetime) = CURDATE()
            ORDER BY attendance_datetime
        `;
        return await query(sql, [emp_id]);
    },

    getCountSummary: async (emp_id) => {
        const sql = `
            SELECT attendance_status, attendance_type, COUNT(*) as count
            FROM attendance
            WHERE emp_id = ?
            GROUP BY attendance_status, attendance_type
        `;
        return await query(sql, [emp_id]);
    },

    getTodayCheckinCount: async () => {
        const sql = `
            SELECT COUNT(DISTINCT emp_id) AS count
            FROM attendance
            WHERE DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
        `;
        const results = await query(sql);
        return results[0]?.count || 0;
    },

  getTodaySummary: async () => {
    // ดึงเวลาเข้างานมาตรฐานมาใช้ในการคำนวณ
    const config = await getWorkTime(); 
    const startWorkTime = config.startwork;

    // REFACTORED: แก้ไข SQL ในส่วนของการนับ absent
    const sql = `
      SELECT 
        SUM(CASE WHEN TIME(attendance_datetime) <= ? THEN 1 ELSE 0 END) AS ontime,
        SUM(CASE WHEN TIME(attendance_datetime) > ? THEN 1 ELSE 0 END) AS late,
        (SELECT COUNT(*) FROM employee) - COUNT(DISTINCT emp_id) AS absent
      FROM attendance
      WHERE DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
    `;
    const results = await query(sql, [startWorkTime, startWorkTime]);
    return results[0] || { ontime: 0, late: 0, absent: 0 };
  },

    // Export ฟังก์ชัน getWorkTime ไปด้วยเผื่อส่วนอื่นเรียกใช้
    getWorkTime: getWorkTime
};

module.exports = Attendance;