const query = require('../utils/db');

// --- Helper function for work time config (อัปเดตให้ดึงค่าที่จำเป็นทั้งหมด) ---
const getCompanySettings = async (companyId) => {
    // ดึงการตั้งค่าทั้งหมดของบริษัทนั้นๆ
    const sql = 'SELECT startwork, endwork, about_late FROM about WHERE company_id = ? LIMIT 1';
    const results = await query(sql, [companyId]);

    if (results.length === 0) {
        console.warn(`No 'about' configuration found for company ${companyId}. Using default settings.`);
        // ค่าเริ่มต้นหากไม่มีการตั้งค่า
        return { startwork: '08:00:00', endwork: '17:00:00', about_late: 0 };
    }
    return results[0];
};

// --- Main Attendance Object ---
const Attendance = {
    checkIn: async (emp_id, companyId) => {
        // --- STEP 1: ตรวจสอบว่าเคยเช็คอินไปแล้วหรือยัง ---
        const checkSql = `
            SELECT 1 FROM attendance
            WHERE emp_id = ? AND company_id = ? AND DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
            LIMIT 1
        `;
        const existingCheckin = await query(checkSql, [emp_id, companyId]);
        if (existingCheckin.length > 0) {
            throw new Error("คุณได้เช็คอินไปแล้วสำหรับวันนี้");
        }

        // --- STEP 2: ดึงการตั้งค่าของบริษัท (ที่อัปเดตแล้ว) ---
        const settings = await getCompanySettings(companyId);
        
        // --- STEP 3: คำนวณเวลาที่อนุโลมให้สายได้ ---
        const now = new Date();
        
        // สร้าง object วันที่สำหรับเวลาเข้างานตามกฎ
        const officialStartTime = new Date(now);
        const [startHour, startMinute] = settings.startwork.split(':').map(Number);
        officialStartTime.setHours(startHour, startMinute, 0, 0); // ตั้งเวลาเริ่มงานของวันนี้

        // สร้าง object วันที่สำหรับเวลาที่อนุโลมให้สายได้ (เวลาเริ่มงาน + นาทีที่อนุโลม)
        const gracePeriodTime = new Date(officialStartTime);
        gracePeriodTime.setMinutes(gracePeriodTime.getMinutes() + (settings.about_late || 0));

        // --- STEP 4: ตัดสินใจสถานะ 'ontime' หรือ 'late' ---
        let status = 'ontime';
        // ถ้าเวลาปัจจุบัน "มากกว่า" เวลาที่อนุโลมให้สายได้ --> ถือว่าสาย
        if (now > gracePeriodTime) {
            status = 'late';
        }

        // --- STEP 5: บันทึกข้อมูลลงฐานข้อมูล ---
        const insertSql = `
            INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type, company_id)
            VALUES (?, ?, ?, 'checkin', ?)
        `;
        return await query(insertSql, [now, status, emp_id, companyId]);
    },

    // --- ฟังก์ชันอื่นๆ ไม่มีการเปลี่ยนแปลง ---

    checkOut: async (emp_id, status, companyId) => {
        const now = new Date();
        const sql = `
            INSERT INTO attendance (attendance_datetime, attendance_status, emp_id, attendance_type, company_id)
            VALUES (?, ?, ?, 'checkout', ?)
        `;
        return await query(sql, [now, status, emp_id, companyId]);
    },

    getTodayAttendance: async (emp_id, companyId) => {
        const sql = `
            SELECT * FROM attendance
            WHERE emp_id = ? AND company_id = ? AND DATE(attendance_datetime) = CURDATE()
            ORDER BY attendance_datetime
        `;
        return await query(sql, [emp_id, companyId]);
    },
    
    // Export helper function เพื่อให้ Controller อื่น (เช่น attendanceController) ยังใช้งานได้
    getWorkTime: async (companyId) => {
        const settings = await getCompanySettings(companyId);
        return { startwork: settings.startwork, endwork: settings.endwork };
    },

    getCountSummary: async (emp_id, companyId) => { 
        const sql = `
            SELECT attendance_status, attendance_type, COUNT(*) as count
            FROM attendance
            WHERE emp_id = ? AND company_id = ?
            GROUP BY attendance_status, attendance_type
        `;
        return await query(sql, [emp_id, companyId]);
    },

    getTodayCheckinCount: async (companyId) => {
        const sql = `
            SELECT COUNT(DISTINCT emp_id) AS count
            FROM attendance
            WHERE company_id = ? AND DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
        `;
        const results = await query(sql, [companyId]);
        return results[0]?.count || 0;
    },

    getTodaySummary: async (companyId) => {
        const settings = await getCompanySettings(companyId);
        const startWorkTime = settings.startwork;

        const sql = `
            SELECT
                SUM(CASE WHEN a.attendance_status = 'ontime' THEN 1 ELSE 0 END) AS ontime,
                SUM(CASE WHEN a.attendance_status = 'late' THEN 1 ELSE 0 END) AS late,
                (SELECT COUNT(*) FROM employee e WHERE e.company_id = ? AND e.emp_status = 'active') - COUNT(DISTINCT a.emp_id) AS absent
            FROM attendance a
            WHERE a.company_id = ? AND DATE(a.attendance_datetime) = CURDATE() AND a.attendance_type = 'checkin'
        `;
        const results = await query(sql, [companyId, companyId]);
        return results[0] || { ontime: 0, late: 0, absent: 0 };
    },
};

module.exports = Attendance;
