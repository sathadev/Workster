// backend/models/dashboardModel.js
// Model สำหรับดึงข้อมูลสรุป (Dashboard Summary)
// แยกส่วน logic ออกจาก controller เพื่อให้ดูแลโค้ดง่ายขึ้น

const query = require('../utils/db');

const DashboardModel = {
  // ดึงข้อมูลสรุปสำหรับบริษัทที่ระบุ (หรือทั้งหมดถ้าเป็น Super Admin)
  getSummary: async (companyId = null) => {
    let filterSql = '';
    let params = [];

    // ถ้าไม่ใช่ Super Admin ให้กรองเฉพาะ company_id นั้น ๆ
    if (companyId !== null) {
      filterSql = 'AND company_id = ?';
      params = [companyId];
    }

    // --- Query 1: ดึงข้อมูลการเช็กอินของวันนี้ ---
    const checkinSql = `
      SELECT
        SUM(CASE WHEN attendance_status = 'ontime' THEN 1 ELSE 0 END) AS ontimeCheckin,
        SUM(CASE WHEN attendance_status = 'late' THEN 1 ELSE 0 END) AS lateCheckin
      FROM attendance
      WHERE DATE(attendance_datetime) = CURDATE() ${filterSql}
    `;

    // --- Query 2: ดึงจำนวนคนที่ลาและได้รับอนุมัติในวันนี้ ---
    const leaveSql = `
      SELECT COUNT(DISTINCT emp_id) AS approvedLeaveCount
      FROM leavework
      WHERE CURDATE() BETWEEN leavework_datestart AND leavework_end
      AND leavework_status = 'approved' ${filterSql}
    `;

    // --- Query 3: ดึงจำนวนพนักงานทั้งหมด (active) ---
    const totalEmployeesSql = `
      SELECT COUNT(*) AS totalEmployees
      FROM employee
      WHERE emp_status = 'active' ${filterSql}
    `;

    // รัน query ทั้งหมดพร้อมกันเพื่อประสิทธิภาพที่ดีกว่า
    const [[summary], [leaveResult], [totalEmployeesResult]] = await Promise.all([
      query(checkinSql, params),
      query(leaveSql, params),
      query(totalEmployeesSql, params),
    ]);

    // แปลงค่าที่ดึงมาให้เป็นตัวเลขแน่นอน
    return {
      ontimeCheckin: parseInt(summary.ontimeCheckin) || 0,
      lateCheckin: parseInt(summary.lateCheckin) || 0,
      approvedLeaveCount: parseInt(leaveResult.approvedLeaveCount) || 0,
      totalActiveEmployees: parseInt(totalEmployeesResult.totalEmployees) || 0,
    };
  },

  // ดึงข้อมูลรวมทั้งหมด (เฉพาะ Super Admin)
  getGlobalStats: async () => {
    // นับจำนวนบริษัททั้งหมดที่ผ่านการอนุมัติแล้ว
    const [companiesResult] = await query(`
      SELECT COUNT(company_id) AS totalCompanies
      FROM companies
      WHERE company_status = 'approved'
    `);

    // นับจำนวนผู้ใช้ทั้งหมดที่ active
    const [usersResult] = await query(`
      SELECT COUNT(emp_id) AS totalUsers
      FROM employee
      WHERE emp_status = 'active'
    `);

    return {
      totalCompanies: companiesResult.totalCompanies || 0,
      totalUsers: usersResult.totalUsers || 0,
    };
  },
};

module.exports = DashboardModel;
