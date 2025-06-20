// backend/routes/salaryRoutes.js
const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware'); // <-- 1. Import protect เข้ามา

// Route สำหรับให้พนักงานดูเงินเดือนของตัวเอง
// GET /api/v1/salaries/me
router.get('/me', protect, salaryController.getMySalary); // <-- 2. เพิ่ม protect

// Routes สำหรับ Admin/HR
// GET /api/v1/salaries
router.get('/', protect, salaryController.getAllSalaries); // <-- 2. เพิ่ม protect

// PUT /api/v1/salaries/:empId
router.put('/:empId', protect, salaryController.updateSalary); // <-- 2. เพิ่ม protect

// GET /api/v1/salaries/:empId
router.get('/:empId', protect, salaryController.getSalaryByEmpId); // <-- 2. เพิ่ม protect

module.exports = router;