// backend/controllers/dashboardController.js
const Attendance = require('../models/attendanceModel');

exports.getSummary = async (req, res) => {
    try {
        const [checkinCount, summary] = await Promise.all([
            Attendance.getTodayCheckinCount(req.companyId), // <--- PASS req.companyId
            Attendance.getTodaySummary(req.companyId) // <--- PASS req.companyId
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