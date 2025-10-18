// backend/routes/aboutRoutes.js
// Route สำหรับจัดการข้อมูลการตั้งค่า (Settings / About Company Policy)

const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/settings
// ดึงข้อมูลการตั้งค่า (เฉพาะผู้ที่ล็อกอินเท่านั้น)
router.get('/', protect, aboutController.getSettings);

// [PUT] /api/v1/settings
// อัปเดตข้อมูลการตั้งค่า (เฉพาะผู้ที่ล็อกอินเท่านั้น)
router.put('/', protect, aboutController.updateSettings);

module.exports = router;
