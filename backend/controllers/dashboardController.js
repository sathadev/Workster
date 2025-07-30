// backend/controllers/dashboardController.js
const db = require('../config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

/**
 * [GET] /api/v1/dashboard/summary
 * ดึงข้อมูลสรุปทั้งหมดที่จำเป็นสำหรับหน้า Dashboard
 * - สำหรับ Super Admin: ดึงข้อมูลรวมของทุกบริษัท
 * - สำหรับ Admin/HR ปกติ: ดึงข้อมูลเฉพาะบริษัทของตนเอง
 */
exports.getSummary = async (req, res) => {
    try {
        let targetCompanyId = req.companyId; // ค่านี้จะเป็น null สำหรับ Super Admin, หรือ company_id สำหรับ Admin/HR
        let companyFilterSql = '';
        let companyFilterParams = [];

        // ถ้าเป็น Super Admin (req.companyId จะเป็น null) ให้ดึงข้อมูลรวมจากทุกบริษัท
        // ถ้าเป็น Admin/HR ปกติ (req.companyId จะมีค่า) ให้ดึงข้อมูลเฉพาะบริษัทนั้น
        if (targetCompanyId !== null) { // ถ้าไม่ใช่ Super Admin
            companyFilterSql = `AND company_id = ?`;
            companyFilterParams = [targetCompanyId];
        }
        // ถ้าเป็น Super Admin, companyFilterSql และ companyFilterParams จะยังคงว่างเปล่า
        // ซึ่งทำให้ WHERE clause ใน SQL query ไม่มีการกรอง company_id

        // --- 1. เตรียมคำสั่ง SQL สำหรับดึงข้อมูลการเช็คอินวันนี้ ---
        const checkinSql = `
            SELECT
                SUM(CASE WHEN attendance_status = 'ontime' THEN 1 ELSE 0 END) AS ontimeCheckin,
                SUM(CASE WHEN attendance_status = 'late' THEN 1 ELSE 0 END) AS lateCheckin
            FROM attendance
            WHERE DATE(attendance_datetime) = CURDATE() ${companyFilterSql}
        `;

        // --- 2. เตรียมคำสั่ง SQL สำหรับดึงจำนวนคนที่ลาและได้รับการอนุมัติในวันนี้ ---
        const leaveSql = `
            SELECT COUNT(DISTINCT emp_id) as approvedLeaveCount
            FROM leavework
            WHERE CURDATE() BETWEEN leavework_datestart AND leavework_end
            AND leavework_status = 'approved' ${companyFilterSql}
        `;

        // --- 3. เตรียมคำสั่ง SQL สำหรับนับพนักงานทั้งหมด (สำหรับคำนวณ absent ใน frontend) ---
        const totalEmployeesSql = `
            SELECT COUNT(*) as totalEmployees
            FROM employee
            WHERE emp_status = 'active' ${companyFilterSql}
        `;

        // --- 4. เตรียมคำสั่ง SQL สำหรับนับจำนวนบริษัททั้งหมด (เฉพาะ Super Admin) ---
        let totalCompanies = null;
        let totalUsers = null;
        if (targetCompanyId === null) { // เฉพาะ Super Admin
            const companiesSql = `SELECT COUNT(company_id) as totalCompanies FROM companies WHERE company_status = 'approved'`;
            const usersSql = `SELECT COUNT(emp_id) as totalUsers FROM employee WHERE emp_status = 'active'`;
            const [companiesResult] = await query(companiesSql);
            const [usersResult] = await query(usersSql);
            totalCompanies = companiesResult.totalCompanies || 0;
            totalUsers = usersResult.totalUsers || 0;
        }

        // ใช้ Promise.all เพื่อให้ query ทำงานพร้อมกัน เพิ่มประสิทธิภาพ
        const [[summary], [leaveResult], [totalEmployeesResult]] = await Promise.all([
            query(checkinSql, companyFilterParams),
            query(leaveSql, companyFilterParams),
            query(totalEmployeesSql, companyFilterParams) // ส่ง params เดียวกัน
        ]);

        const ontimeCheckin = parseInt(summary.ontimeCheckin) || 0;
        const lateCheckin = parseInt(summary.lateCheckin) || 0;
        const approvedLeaveCount = parseInt(leaveResult.approvedLeaveCount) || 0;
        const totalActiveEmployees = parseInt(totalEmployeesResult.totalEmployees) || 0;

        // คำนวณจำนวนขาดงาน: พนักงานทั้งหมด - คนที่เช็คอินตรงเวลา - คนที่เช็คอินสาย - คนที่ลาอนุมัติ
        // (หรือจะให้ง่ายกว่าคือ นับคนที่ยังไม่เช็คอิน)
        // สำหรับ Super Admin ที่ดูภาพรวมรวมทุกบริษัท อาจจะนับรวมทั้งหมด
        const totalCheckedIn = ontimeCheckin + lateCheckin;
        const absentCount = Math.max(0, totalActiveEmployees - totalCheckedIn - approvedLeaveCount); // ลบคนที่ลาออก/ลาอนุมัติ

        // ส่งข้อมูลทั้งหมดกลับไปในรูปแบบ JSON ที่หน้าเว็บต้องการ
        res.status(200).json({
            ontimeCheckin: ontimeCheckin,
            lateCheckin: lateCheckin,
            approvedLeaveCount: approvedLeaveCount,
            totalActiveEmployees: totalActiveEmployees, // เพิ่มข้อมูลพนักงานทั้งหมด
            absentCount: absentCount, // คำนวณคนที่ขาดงานโดยประมาณ
            totalCompanies, // เพิ่มจำนวนบริษัท (ถ้าไม่ใช่ Super Admin จะเป็น null)
            totalUsers, // เพิ่มจำนวนผู้ใช้ทั้งหมด (ถ้าไม่ใช่ Super Admin จะเป็น null)
        });

    } catch (error) {
        console.error("API Error [GET /dashboard/summary]:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป' });
    }
};