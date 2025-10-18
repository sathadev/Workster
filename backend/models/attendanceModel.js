// backend/models/attendanceModel.js
// Model สำหรับจัดการข้อมูลการลงเวลาเข้า-ออกงาน (Attendance)
// ใช้ร่วมกับข้อมูลการตั้งค่าของบริษัท (ตาราง about) เพื่อคำนวณสถานะ เช่น มาตรงเวลา / มาสาย

const query = require('../utils/db'); // ฟังก์ชัน query() สำหรับรัน SQL แบบ async/await

// Helper Function: ดึงการตั้งค่าของบริษัท (เวลาเริ่มงาน, เลิกงาน, สิทธิสาย)
const getCompanySettings = async (companyId) => {
  const sql = `
    SELECT startwork, endwork, about_late
    FROM about
    WHERE company_id = ?
    LIMIT 1
  `;
  const results = await query(sql, [companyId]);

  // ถ้ายังไม่มีข้อมูลการตั้งค่า → ใช้ค่ามาตรฐานเริ่มต้นแทน
  if (results.length === 0) {
    console.warn(
      `No 'about' configuration found for company ${companyId}. Using default settings.`
    );
    return { startwork: '08:00:00', endwork: '17:00:00', about_late: 0 };
  }

  return results[0];
};

// Main Attendance Object: รวมทุกฟังก์ชันที่เกี่ยวกับการลงเวลาเข้า-ออกงาน
const Attendance = {
  // ฟังก์ชันเช็กอิน (Check-in)
  checkIn: async (emp_id, companyId) => {
    // STEP 1: ตรวจสอบว่าพนักงานเช็กอินไปแล้วหรือยังในวันเดียวกัน
    const checkSql = `
      SELECT 1
      FROM attendance
      WHERE emp_id = ?
        AND company_id = ?
        AND DATE(attendance_datetime) = CURDATE()
        AND attendance_type = 'checkin'
      LIMIT 1
    `;
    const existingCheckin = await query(checkSql, [emp_id, companyId]);
    if (existingCheckin.length > 0) {
      throw new Error('คุณได้เช็กอินไปแล้วสำหรับวันนี้');
    }

    // STEP 2: ดึงการตั้งค่าการทำงานของบริษัท
    const settings = await getCompanySettings(companyId);

    // STEP 3: คำนวณเวลาอนุโลมให้สายได้
    const now = new Date();

    // เวลาเริ่มงานจริงของวันนี้ (แปลง string → object)
    const officialStartTime = new Date(now);
    const [startHour, startMinute] = settings.startwork.split(':').map(Number);
    officialStartTime.setHours(startHour, startMinute, 0, 0);

    // เวลาอนุโลมให้สาย (เริ่มงาน + about_late นาที)
    const gracePeriodTime = new Date(officialStartTime);
    gracePeriodTime.setMinutes(
      gracePeriodTime.getMinutes() + (settings.about_late || 0)
    );

    // STEP 4: ตัดสินสถานะ 'ontime' หรือ 'late'
    let status = 'ontime';
    if (now > gracePeriodTime) {
      status = 'late';
    }

    // STEP 5: บันทึกการเช็กอินลงฐานข้อมูล
    const insertSql = `
      INSERT INTO attendance (
        attendance_datetime,
        attendance_status,
        emp_id,
        attendance_type,
        company_id
      )
      VALUES (?, ?, ?, 'checkin', ?)
    `;
    return await query(insertSql, [now, status, emp_id, companyId]);
  },

  // ฟังก์ชันเช็กเอาต์ (Check-out)
  checkOut: async (emp_id, status, companyId) => {
    const now = new Date();
    const sql = `
      INSERT INTO attendance (
        attendance_datetime,
        attendance_status,
        emp_id,
        attendance_type,
        company_id
      )
      VALUES (?, ?, ?, 'checkout', ?)
    `;
    return await query(sql, [now, status, emp_id, companyId]);
  },

  // ดึงข้อมูลการลงเวลาของวันนี้ (ทั้งเข้าและออก)
  getTodayAttendance: async (emp_id, companyId) => {
    const sql = `
      SELECT *
      FROM attendance
      WHERE emp_id = ?
        AND company_id = ?
        AND DATE(attendance_datetime) = CURDATE()
      ORDER BY attendance_datetime
    `;
    return await query(sql, [emp_id, companyId]);
  },

  // ดึงเวลาเริ่มงานและเลิกงานของบริษัท
  getWorkTime: async (companyId) => {
    const settings = await getCompanySettings(companyId);
    return { startwork: settings.startwork, endwork: settings.endwork };
  },

  // สรุปจำนวนสถานะการลงเวลาทั้งหมดของพนักงาน (on time / late / checkout)
  getCountSummary: async (emp_id, companyId) => {
    const sql = `
      SELECT attendance_status, attendance_type, COUNT(*) AS count
      FROM attendance
      WHERE emp_id = ? AND company_id = ?
      GROUP BY attendance_status, attendance_type
    `;
    return await query(sql, [emp_id, companyId]);
  },

  // นับจำนวนพนักงานที่เช็กอินในวันปัจจุบัน
  getTodayCheckinCount: async (companyId) => {
    const sql = `
      SELECT COUNT(DISTINCT emp_id) AS count
      FROM attendance
      WHERE company_id = ?
        AND DATE(attendance_datetime) = CURDATE()
        AND attendance_type = 'checkin'
    `;
    const results = await query(sql, [companyId]);
    return results[0]?.count || 0;
  },

  // สรุปสถานะรวมของพนักงานในวันนี้ (มากี่คน สายกี่คน ขาดกี่คน)
  getTodaySummary: async (companyId) => {
    // ดึงเวลาทำงาน (เผื่อใช้ในอนาคต เช่น รายงาน)
    const settings = await getCompanySettings(companyId);
    const startWorkTime = settings.startwork;

    const sql = `
      SELECT
        SUM(CASE WHEN a.attendance_status = 'ontime' THEN 1 ELSE 0 END) AS ontime,
        SUM(CASE WHEN a.attendance_status = 'late' THEN 1 ELSE 0 END) AS late,
        (SELECT COUNT(*)
         FROM employee e
         WHERE e.company_id = ?
           AND e.emp_status = 'active')
        - COUNT(DISTINCT a.emp_id) AS absent
      FROM attendance a
      WHERE a.company_id = ?
        AND DATE(a.attendance_datetime) = CURDATE()
        AND a.attendance_type = 'checkin'
    `;
    const results = await query(sql, [companyId, companyId]);
    return results[0] || { ontime: 0, late: 0, absent: 0 };
  },
};

// Export Model
module.exports = Attendance;
