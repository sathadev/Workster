// backend/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.get('/today', attendanceController.getTodaysUserAttendance);
router.post('/checkin', attendanceController.handleCheckIn);
router.post('/checkout', attendanceController.handleCheckOut);

module.exports = router;