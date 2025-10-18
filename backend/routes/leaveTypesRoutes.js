// backend/routes/leaveTypesRoutes.js
// Route สำหรับจัดการประเภทการลา (Leave Types)

const express = require('express');
const router = express.Router();
const leaveTypesController = require('../controllers/leaveTypesController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/leave-types
// ดึงข้อมูลประเภทการลาทั้งหมด (เช่น ลาป่วย, ลากิจ, ลาพักร้อน)
// ต้องผ่านการยืนยันตัวตนก่อนเข้าถึง (Employee / HR / Admin)
router.get('/', protect, leaveTypesController.getAllLeaveTypes);

module.exports = router;
