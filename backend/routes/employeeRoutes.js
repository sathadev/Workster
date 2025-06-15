// backend/routes/employeeRoutes.js

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// Middleware สำหรับตรวจสอบการล็อกอิน (ถ้ามี สามารถนำมาใช้ตรงนี้ได้)
// const authMiddleware = require('../middleware/authMiddleware');

// ------------------- Employee Resource Routes -------------------

// GET /api/v1/employees -> ดึงพนักงานทั้งหมด
router.get('/', employeeController.getAllEmployees);

// POST /api/v1/employees -> สร้างพนักงานใหม่
// เรานำ uploadImage middleware มาใช้คั่นกลางก่อนจะไปถึง createEmployee
router.post('/', employeeController.uploadImage, employeeController.createEmployee);

// GET /api/v1/employees/:id -> ดึงข้อมูลพนักงานรายบุคคล
router.get('/:id', employeeController.getEmployeeById);

// PUT /api/v1/employees/:id -> อัปเดตข้อมูลพนักงาน
router.put('/:id', employeeController.uploadImage, employeeController.updateEmployee);

// DELETE /api/v1/employees/:id -> ลบพนักงาน
router.delete('/:id', employeeController.deleteEmployee);


// ------------------- Profile Route (Special Case) -------------------
// หมายเหตุ: Route นี้อาจจะย้ายไปอยู่ที่ /api/v1/profile ในอนาคตเพื่อความชัดเจน
// แต่ตอนนี้เราสามารถเรียกใช้ผ่าน /api/v1/employees/profile ได้ก่อน (ถ้าตั้งค่าใน app.js)
// หรือ /profile ถ้าตั้งค่า app.use('/',...)
router.get('/profile', employeeController.viewProfile);


module.exports = router;