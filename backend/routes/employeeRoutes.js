// backend/routes/employeeRoutes.js

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');

// ดึง Middleware 'uploadImage' ที่เราสร้างไว้ใน Controller ออกมา
const { uploadImage } = employeeController;


// --- ลำดับของ Route มีความสำคัญมาก ---
// เส้นทางที่เจาะจง (Specific Routes) ต้องอยู่ก่อนเส้นทางที่มีพารามิเตอร์เสมอ

// GET /api/v1/employees/profile -> ดึงโปรไฟล์ของตัวเอง
router.get('/profile', protect, employeeController.viewProfile);

// GET /api/v1/employees/view/:id -> ดึงข้อมูลพนักงานคนเดียว
// ใช้ /view/ เพื่อแยกเส้นทางออกจาก /:id อื่นๆ ให้ชัดเจน
router.get('/:id', protect, employeeController.getEmployeeById);

// GET /api/v1/employees -> ดึงพนักงานทั้งหมด
router.get('/', protect, employeeController.getAllEmployees);

// POST /api/v1/employees -> สร้างพนักงานใหม่
router.post('/', protect, uploadImage, employeeController.createEmployee);

// PUT /api/v1/employees/:id -> อัปเดตข้อมูลพนักงาน
router.put('/:id', protect, uploadImage, employeeController.updateEmployee);

// DELETE /api/v1/employees/:id -> ลบพนักงาน
router.delete('/:id', protect, employeeController.deleteEmployee);


module.exports = router;
