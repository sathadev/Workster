// backend/routes/employeeRoutes.js
// Route สำหรับจัดการข้อมูลพนักงาน (Employee Management)

const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');

// ดึง middleware uploadImage จาก controller (multer สำหรับจัดการรูปภาพพนักงาน)
const { uploadImage } = employeeController;

// [GET] /api/v1/employees/profile
// ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่
router.get('/profile', protect, employeeController.viewProfile);

// [POST] /api/v1/employees
// เพิ่มข้อมูลพนักงานใหม่ พร้อมอัปโหลดรูปภาพ
router.post('/', protect, uploadImage, employeeController.createEmployee);

// [PUT] /api/v1/employees/:id
// แก้ไขข้อมูลพนักงาน พร้อมอัปโหลดรูปภาพใหม่ (ถ้ามี)
router.put('/:id', protect, uploadImage, employeeController.updateEmployee);

// [GET] /api/v1/employees
// ดึงข้อมูลพนักงานทั้งหมด (ต้องล็อกอิน)
router.get('/', protect, employeeController.getAllEmployees);

// [GET] /api/v1/employees/:id
// ดึงข้อมูลพนักงานรายบุคคล (ต้องล็อกอิน)
router.get('/:id', protect, employeeController.getEmployeeById);

// [DELETE] /api/v1/employees/:id
// ลบข้อมูลพนักงานออกจากระบบ (ต้องล็อกอิน)
router.delete('/:id', protect, employeeController.deleteEmployee);

module.exports = router;
