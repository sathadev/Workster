// backend/routes/aboutRoutes.js
const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

// GET /api/v1/settings -> ดึงข้อมูลการตั้งค่า
router.get('/', aboutController.getSettings);

// PUT /api/v1/settings -> อัปเดตข้อมูลการตั้งค่า
router.put('/', aboutController.updateSettings);

module.exports = router;