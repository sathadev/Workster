// backend/routes/leaveworkRoutes.js
const express = require('express');
const router = express.Router();
const leaveworkController = require('../controllers/leaveworkController');

// Routes สำหรับ Admin
router.get('/', leaveworkController.getAllLeaveRequests);
router.patch('/:id/status', leaveworkController.updateLeaveStatus);

// Routes สำหรับพนักงานทั่วไป
router.post('/', leaveworkController.createLeaveRequest);
router.get('/my-requests', leaveworkController.getMyLeaveRequests);

module.exports = router;