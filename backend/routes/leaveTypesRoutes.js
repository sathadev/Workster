// backend/routes/leaveTypesRoutes.js
const express = require('express');
const router = express.Router();
const leaveTypesController = require('../controllers/leaveTypesController');

router.get('/', leaveTypesController.getAllLeaveTypes);

module.exports = router;