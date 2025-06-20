// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware'); // <-- Import เข้ามา

// GET /api/v1/dashboard/summary
// ต้องใส่ protect เพื่อให้แน่ใจว่าเฉพาะผู้ที่ล็อกอินแล้วเท่านั้นที่เห็นข้อมูลสรุปได้
router.get('/summary', protect, dashboardController.getSummary);

module.exports = router;