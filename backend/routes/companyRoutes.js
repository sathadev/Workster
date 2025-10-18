// backend/routes/companyRoutes.js
// Route สำหรับจัดการข้อมูลบริษัท (Company Management)

const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/companies
// ดึงข้อมูลบริษัททั้งหมด (ต้องล็อกอิน)
router.get('/', protect, companyController.getAllCompanies);

// [GET] /api/v1/companies/:id
// ดึงข้อมูลรายละเอียดบริษัทตาม ID (ต้องล็อกอิน)
router.get('/:id', protect, companyController.getCompanyById);

// [POST] /api/v1/companies
// เพิ่มข้อมูลบริษัทใหม่ (ต้องล็อกอิน)
router.post('/', protect, companyController.createCompany);

// [PUT] /api/v1/companies/:id
// อัปเดตข้อมูลบริษัททั้งหมด (ต้องล็อกอิน)
router.put('/:id', protect, companyController.updateCompany);

// [DELETE] /api/v1/companies/:id
// ลบบริษัทออกจากระบบ (ต้องล็อกอิน)
router.delete('/:id', protect, companyController.deleteCompany);

module.exports = router;
