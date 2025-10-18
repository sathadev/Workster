// backend/routes/leaveworkRoutes.js
// Route สำหรับจัดการคำขอลาของพนักงาน (Leave Requests)

const express = require('express');
const router = express.Router();
const leaveworkController = require('../controllers/leaveworkController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/leave-requests
// ดึงข้อมูลคำขอลาทั้งหมด (สำหรับ HR/Admin)
// รองรับการค้นหา กรอง เรียงลำดับ และแบ่งหน้า
router.get('/', protect, leaveworkController.getAllLeaveRequests);

// [PATCH] /api/v1/leave-requests/:id/status
// อัปเดตสถานะคำขอลา (อนุมัติ / ปฏิเสธ) (สำหรับ HR/Admin)
router.patch('/:id/status', protect, leaveworkController.updateLeaveStatus);

// [POST] /api/v1/leave-requests
// สร้างคำขอลาใหม่ (สำหรับพนักงานทั่วไป)
router.post('/', protect, leaveworkController.createLeaveRequest);

// [GET] /api/v1/leave-requests/my-requests
// ดึงประวัติการลาของผู้ใช้งานปัจจุบัน (Employee)
router.get('/my-requests', protect, leaveworkController.getMyLeaveRequests);

module.exports = router;
