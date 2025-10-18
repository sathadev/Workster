// backend/routes/adminCompanyRoutes.js
// Route สำหรับจัดการข้อมูลบริษัท (เฉพาะ Super Admin)

const express = require('express');
const router = express.Router();
const adminCompanyController = require('../controllers/adminCompanyController');
const { protect } = require('../middleware/authMiddleware');

// ใช้ protect เพื่อให้มั่นใจว่าผู้ใช้ล็อกอินและมี JWT ก่อนเข้าถึง
// ตรวจสอบสิทธิ์ Super Admin ภายใน controller อีกชั้นหนึ่ง

// [GET] /api/v1/admin/companies 
// ดึงข้อมูลบริษัททั้งหมด (Super Admin)
router.get('/', protect, adminCompanyController.getAllCompaniesForAdmin);

// [GET] /api/v1/admin/companies/:id 
// ดึงข้อมูลรายละเอียดบริษัทเฉพาะรายการ (Super Admin)
router.get('/:id', protect, adminCompanyController.getCompanyByIdForAdmin);

// [PATCH] /api/v1/admin/companies/:id/status 
// อัปเดตสถานะบริษัท เช่น Approved / Rejected (Super Admin)
router.patch('/:id/status', protect, adminCompanyController.updateCompanyStatus);

// [DELETE] /api/v1/admin/companies/:id 
// ลบบริษัทออกจากระบบ (Super Admin)
router.delete('/:id', protect, adminCompanyController.deleteCompanyByAdmin);

module.exports = router;
