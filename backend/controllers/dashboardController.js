// backend/controllers/dashboardController.js
// Controller สำหรับหน้า Dashboard (Summary)
// ใช้ดึงข้อมูลภาพรวม เช่น เช็กอิน, ลา, ขาดงาน, จำนวนพนักงาน ฯลฯ

const DashboardModel = require('../models/dashboardModel');

// [GET] /api/v1/dashboard/summary
// ดึงข้อมูลสรุปทั้งหมดที่จำเป็นสำหรับหน้า Dashboard
// - Super Admin: แสดงข้อมูลรวมของทุกบริษัท
// - HR/Admin: แสดงข้อมูลเฉพาะบริษัทของตนเอง
exports.getSummary = async (req, res) => {
  try {
    const companyId = req.companyId; // ถ้าเป็น Super Admin จะเป็น null

    // ดึงข้อมูลสรุปพื้นฐาน (attendance, leave, employee)
    const baseSummary = await DashboardModel.getSummary(companyId);

    // ดึงข้อมูลเพิ่มเติมเฉพาะ Super Admin
    let globalStats = { totalCompanies: null, totalUsers: null };
    if (companyId === null) {
      globalStats = await DashboardModel.getGlobalStats();
    }

    // แยกค่าที่ได้จากฐานข้อมูล
    const { ontimeCheckin, lateCheckin, approvedLeaveCount, totalActiveEmployees } = baseSummary;

    // คำนวณจำนวนขาดงานโดยประมาณ
    const totalCheckedIn = ontimeCheckin + lateCheckin;
    const absentCount = Math.max(0, totalActiveEmployees - totalCheckedIn - approvedLeaveCount);

    // ส่งข้อมูลกลับให้ frontend
    res.status(200).json({
      ...baseSummary,  // ข้อมูลพื้นฐาน
      absentCount,     // จำนวนพนักงานที่ไม่เช็กอิน
      ...globalStats,  // ข้อมูลรวม (เฉพาะ Super Admin)
    });

  } catch (error) {
    console.error("API Error [GET /dashboard/summary]:", error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสรุป' });
  }
};
