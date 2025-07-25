// backend/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController'); // ตรวจสอบให้แน่ใจว่าเส้นทางนี้ถูกต้อง

// หากคุณมี middleware สำหรับการตรวจสอบสิทธิ์ (Authentication) และบทบาท (Authorization)
// เช่น const { protect, authorize } = require('../middleware/authMiddleware');
// คุณสามารถนำมาใช้ได้ที่นี่ เช่น router.get('/', protect, authorize(['admin']), companyController.getAllCompanies);

router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/', companyController.createCompany);
router.put('/:id', companyController.updateCompany); // ใช้ PUT สำหรับการอัปเดตข้อมูลทั้งหมด
router.delete('/:id', companyController.deleteCompany);

module.exports = router; 