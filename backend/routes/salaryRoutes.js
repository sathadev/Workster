// backend/routes/salaryRoutes.js
const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
// const { isAdmin, isLoggedIn } = require('../middleware/authMiddleware'); // ตัวอย่าง Middleware

// Route สำหรับให้พนักงานดูเงินเดือนของตัวเอง
// GET /api/v1/salaries/me
router.get('/me', salaryController.getMySalary);

// Routes สำหรับ Admin/HR
// GET /api/v1/salaries
router.get('/', salaryController.getAllSalaries);

// PUT /api/v1/salaries/:empId
router.put('/:empId', salaryController.updateSalary);

module.exports = router;