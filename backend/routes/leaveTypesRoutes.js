// backend/routes/leaveTypesRoutes.js
const express = require('express');
const router = express.Router();
const leaveTypesController = require('../controllers/leaveTypesController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, leaveTypesController.getAllLeaveTypes);

module.exports = router;