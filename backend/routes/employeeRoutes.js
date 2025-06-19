// backend/routes/employeeRoutes.js
const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const evaluationController = require('../controllers/evaluationController');

// --- Employee Resource Routes ---
router.get('/', employeeController.getAllEmployees);
router.post('/', employeeController.uploadImage, employeeController.createEmployee);

// --- CORRECTED ORDER ---
// Route ที่เฉพาะเจาะจง (เช่น /profile) ต้องอยู่บน
router.get('/profile', employeeController.viewProfile);

// Route ที่เป็นตัวแปร/ทั่วไป (เช่น /:id) ต้องอยู่ล่าง
router.get('/:id', employeeController.getEmployeeById);

// Routes อื่นๆ สำหรับ :id
router.put('/:id', employeeController.uploadImage, employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);


module.exports = router;