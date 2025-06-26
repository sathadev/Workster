// backend/routes/leaveworkRoutes.js
const express = require('express');
const router = express.Router();
const leaveworkController = require('../controllers/leaveworkController');
const { protect } = require('../middleware/authMiddleware'); // <-- 1. Import protect เข้ามา

// Routes สำหรับ Admin
// GET /api/v1/leave-requests
router.get('/', protect, leaveworkController.getAllLeaveRequests); // <-- 2. เพิ่ม protect

// PATCH /api/v1/leave-requests/:id/status
router.patch('/:id/status', protect, leaveworkController.updateLeaveStatus); // <-- 2. เพิ่ม protect

// Routes สำหรับพนักงานทั่วไป
// POST /api/v1/leave-requests
router.post('/', protect, leaveworkController.createLeaveRequest); // <-- 2. เพิ่ม protect

// GET /api/v1/leave-requests/my-requests
router.get('/my-requests', protect, leaveworkController.getMyLeaveRequests); // <-- 2. เพิ่ม protect

module.exports = router;