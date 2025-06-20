// backend/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/authMiddleware'); 

router.get('/today', protect, attendanceController.getTodaysUserAttendance);
router.post('/checkin', protect, attendanceController.handleCheckIn);
router.post('/checkout', protect, attendanceController.handleCheckOut);

module.exports = router;