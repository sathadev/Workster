// backend/routes/aboutRoutes.js
const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
const { protect } = require('../middleware/authMiddleware'); // <-- Import เข้ามา

// GET /api/v1/settings - ดึงข้อมูลการตั้งค่า
// ต้อง protect เพื่อให้เฉพาะผู้ที่ login แล้วเท่านั้นที่เห็นได้
router.get('/', protect, aboutController.getSettings);

// PUT /api/v1/settings - อัปเดตข้อมูลการตั้งค่า
// ต้อง protect เพื่อให้เฉพาะผู้ที่ login แล้วเท่านั้นที่แก้ไขได้
router.put('/', protect, aboutController.updateSettings);

module.exports = router;