// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');

// --- ส่วนที่แก้ไข ---
// ดึง Middleware 'uploadImage' ที่เราสร้างไว้ใน Controller ออกมา
// (uploadImage คือ multer ที่ตั้งค่าแล้ว)
const { uploadImage } = employeeController;


// --- แก้ไข Routes ที่มีการอัปโหลดไฟล์ ---
router.get('/profile', protect, employeeController.viewProfile);

// POST /api/v1/employees - สร้างพนักงานใหม่
// เราต้องเพิ่ม `uploadImage` เข้าไปคั่นกลาง เพื่อให้ multer จัดการ req.body และ req.file ให้เรา
router.post('/', protect, uploadImage, employeeController.createEmployee);

// PUT /api/v1/employees/:id - อัปเดตข้อมูล
// ต้องมี uploadImage ด้วยเผื่อมีการอัปเดตไฟล์รูป
router.put('/:id', protect, uploadImage, employeeController.updateEmployee);


// --- Routes อื่นๆ ที่ไม่มีการอัปโหลดไฟล์ ก็จะใช้แค่ protect เหมือนเดิม ---
router.get('/', protect, employeeController.getAllEmployees);
router.get('/:id', protect, employeeController.getEmployeeById);
router.delete('/:id', protect, employeeController.deleteEmployee);



module.exports = router;