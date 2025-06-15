// backend/controllers/dashboardController.js
const Attendance = require('../models/attendanceModel');

// [GET] /api/v1/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    // ดึงข้อมูลสรุปที่จำเป็นสำหรับ Dashboard
    const [checkinCount, summary] = await Promise.all([
      Attendance.getTodayCheckinCount(),
      Attendance.getTodaySummary()
    ]);
    
    res.status(200).json({
      checkinCount,
      ontimeCount: summary.ontime,
      lateCount: summary.late,
      absentCount: summary.absent,
    });
  } catch (err) {
    console.error("API Error [getSummary]:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดข้อมูลสรุป" });
  }
};