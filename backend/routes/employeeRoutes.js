// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');
// --- Employee Resource Routes ---
router.get('/', protect, employeeController.getAllEmployees);
router.post('/', protect, employeeController.uploadImage, employeeController.createEmployee);

// --- CORRECTED ORDER ---
// Route ที่เฉพาะเจาะจง (เช่น /profile) ต้องอยู่บน
router.get('/profile', protect, employeeController.viewProfile);
// Route ที่เป็นตัวแปร/ทั่วไป (เช่น /:id) ต้องอยู่ล่าง
router.get('/:id', protect, employeeController.getEmployeeById);

// Routes อื่นๆ สำหรับ :id
router.put('/:id', protect, employeeController.uploadImage, employeeController.updateEmployee);

router.delete('/:id', protect, employeeController.deleteEmployee);
router.get('/profile', protect, employeeController.viewProfile);


module.exports = router;