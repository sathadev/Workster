// backend/models/attendanceModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// --- Helper function for work time config ---
const getWorkTime = async (companyId) => { // <--- companyId is still passed, but we won't use it for the 'about' table query
    // **CORRECTED:** If 'about' table DOES NOT HAVE 'company_id' column (Global settings):
    const sql = 'SELECT startwork, endwork FROM about LIMIT 1';
    const results = await query(sql); // <--- DO NOT pass companyId here, as 'about' is global.

    // If you later decide to add 'company_id' to your 'about' table,
    // you would use this SQL instead (and ensure you update the DB for 'about' table):
    // const sql = 'SELECT startwork, endwork FROM about WHERE company_id = ? LIMIT 1';
    // const results = await query(sql, [companyId]);

    if (results.length === 0) {
        console.warn(`No 'about' configuration found. Using default global settings.`); // Adjusted warning message
        return { startwork: '08:00:00', endwork: '17:00:00' }; // Provide a fallback default
    }
    return results[0];
};
// --- Main Attendance Object ---
const Attendance = {
    checkIn: async (emp_id, companyId) => { // <--- Accepts companyId
        const checkSql = `
            SELECT 1 FROM attendance
            WHERE emp_id = ? AND company_id = ? AND DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
            LIMIT 1
        `;
        // Ensure emp_id and companyId are passed in order
        const existingCheckin = await query(checkSql, [emp_id, companyId]);
        if (existingCheckin.length > 0) {
            throw new Error("You have already checked in today.");
        }

        const config = await getWorkTime(companyId); // <--- Pass companyId
        const [startHour, startMinute] = config.startwork.split(':').map(Number);
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        let status = 'late';
        if (currentHour < startHour || (currentHour === startHour && currentMinute <= startMinute)) {
            status = 'ontime';
        }

        const insertSql = `
            INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type, company_id)
            VALUES (?, ?, ?, 'checkin', ?)
        `;
        // Ensure values match placeholders: now, status, emp_id, companyId
        return await query(insertSql, [now, status, emp_id, companyId]);
    },

    checkOut: async (emp_id, status, companyId) => { // <--- Accepts companyId
        const now = new Date();
        const sql = `
            INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type, company_id)
            VALUES (?, ?, ?, 'checkout', ?)
        `;
        // Ensure values match placeholders: now, status, emp_id, companyId
        return await query(sql, [now, status, emp_id, companyId]);
    },

    getTodayAttendance: async (emp_id, companyId) => { // <--- Accepts companyId
        const sql = `
            SELECT * FROM attendance
            WHERE emp_id = ? AND company_id = ? AND DATE(attendance_datetime) = CURDATE()
            ORDER BY attendance_datetime
        `;
        // Ensure emp_id and companyId are passed in order
        return await query(sql, [emp_id, companyId]);
    },

    getCountSummary: async (emp_id, companyId) => { // <--- Accepts companyId
        const sql = `
            SELECT attendance_status, attendance_type, COUNT(*) as count
            FROM attendance
            WHERE emp_id = ? AND company_id = ?
            GROUP BY attendance_status, attendance_type
        `;
        // Ensure emp_id and companyId are passed in order
        return await query(sql, [emp_id, companyId]);
    },

    getTodayCheckinCount: async (companyId) => { // <--- Accepts companyId
        const sql = `
            SELECT COUNT(DISTINCT emp_id) AS count
            FROM attendance
            WHERE company_id = ? AND DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
        `;
        // Ensure companyId is passed
        const results = await query(sql, [companyId]);
        return results[0]?.count || 0;
    },

    getTodaySummary: async (companyId) => { // <--- Accepts companyId
        const config = await getWorkTime(companyId); // <--- Pass companyId
        const startWorkTime = config.startwork;

        const sql = `
            SELECT
                SUM(CASE WHEN TIME(a.attendance_datetime) <= ? THEN 1 ELSE 0 END) AS ontime,
                SUM(CASE WHEN TIME(a.attendance_datetime) > ? THEN 1 ELSE 0 END) AS late,
                -- Subquery for absent count must also filter by company_id
                (SELECT COUNT(*) FROM employee e WHERE e.company_id = ?) - COUNT(DISTINCT a.emp_id) AS absent
            FROM attendance a
            WHERE a.company_id = ? AND DATE(a.attendance_datetime) = CURDATE() AND a.attendance_type = 'checkin'
        `;
        // Ensure all four placeholders are filled correctly:
        // 1. startWorkTime (for ontime)
        // 2. startWorkTime (for late)
        // 3. companyId (for employee count subquery)
        // 4. companyId (for main attendance table filter)
        const results = await query(sql, [startWorkTime, startWorkTime, companyId, companyId]);
        return results[0] || { ontime: 0, late: 0, absent: 0 };
    },

    getWorkTime: getWorkTime // Export the helper
};

module.exports = Attendance;