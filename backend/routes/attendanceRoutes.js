// backend/routes/attendanceRoutes.js
// Route สำหรับจัดการข้อมูลการเช็กอินเช็กเอาต์ (Attendance)

const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/attendance/today
// ดึงข้อมูลการเช็กอิน/เช็กเอาต์ของผู้ใช้ประจำวัน (ต้องล็อกอิน)
router.get('/today', protect, attendanceController.getTodaysUserAttendance);

// [POST] /api/v1/attendance/checkin
// บันทึกเวลาเช็กอินของผู้ใช้ (ต้องล็อกอิน)
router.post('/checkin', protect, attendanceController.handleCheckIn);

// [POST] /api/v1/attendance/checkout
// บันทึกเวลาเช็กเอาต์ของผู้ใช้ (ต้องล็อกอิน)
router.post('/checkout', protect, attendanceController.handleCheckOut);

module.exports = router;
