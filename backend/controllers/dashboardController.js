const db = require('../config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

/**
 * [GET] /api/v1/dashboard/summary
 * ดึงข้อมูลสรุปทั้งหมดที่จำเป็นสำหรับหน้า Dashboard
 */
exports.getSummary = async (req, res) => {
    try {
        // ใช้ company_id จาก user token ที่ผ่าน middleware มา
        const { company_id } = req.user;

        if (!company_id) {
            return res.status(400).json({ message: "ไม่พบ Company ID" });
        }

        // --- 1. เตรียมคำสั่ง SQL สำหรับดึงข้อมูลการเช็คอินวันนี้ ---
        const checkinSql = `
            SELECT
                SUM(CASE WHEN attendance_status = 'ontime' THEN 1 ELSE 0 END) AS ontimeCheckin,
                SUM(CASE WHEN attendance_status = 'late' THEN 1 ELSE 0 END) AS lateCheckin
            FROM attendance
            WHERE company_id = ? AND DATE(attendance_datetime) = CURDATE() AND attendance_type = 'checkin'
        `;
        
        // --- 2. เตรียมคำสั่ง SQL สำหรับดึงจำนวนคนที่ลาและได้รับการอนุมัติในวันนี้ ---
        const leaveSql = `
            SELECT COUNT(DISTINCT emp_id) as approvedLeaveCount
            FROM leavework
            WHERE company_id = ? 
              AND CURDATE() BETWEEN leavework_datestart AND leavework_end
              AND leavework_status = 'approved'
        `;

        // ใช้ Promise.all เพื่อให้ query ทำงานพร้อมกัน เพิ่มประสิทธิภาพ
        const [[summary], [leaveResult]] = await Promise.all([
            query(checkinSql, [company_id]),
            query(leaveSql, [company_id])
        ]);

        // ส่งข้อมูลทั้งหมดกลับไปในรูปแบบ JSON ที่หน้าเว็บต้องการ
        res.status(200).json({
            ontimeCheckin: parseInt(summary.ontimeCheckin) || 0,
            lateCheckin: parseInt(summary.lateCheckin) || 0,
            approvedLeaveCount: parseInt(leaveResult.approvedLeaveCount) || 0,
        });

    } catch (error) {
        console.error("API Error [GET /dashboard/summary]:", error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป' });
    }
};
