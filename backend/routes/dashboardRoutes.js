// backend/routes/dashboardRoutes.js
// Route สำหรับดึงข้อมูลสรุปภาพรวม (Dashboard Summary)

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/dashboard/summary
// ดึงข้อมูลสรุปภาพรวมของระบบ เช่น จำนวนพนักงาน การลา และอื่น ๆ (ต้องล็อกอิน)
router.get('/summary', protect, dashboardController.getSummary);

module.exports = router;
