// backend/routes/adminCompanyRoutes.js
const express = require('express');
const router = express.Router();
const adminCompanyController = require('../controllers/adminCompanyController');
const { protect } = require('../middleware/authMiddleware'); // จำเป็นต้องใช้ protect middleware

// ใช้ protect middleware เพื่อให้มั่นใจว่ามี JWT และผู้ใช้ล็อกอินอยู่
// จากนั้นตรวจสอบสิทธิ์ภายใน controller อีกครั้ง (Super Admin only)

// GET /api/v1/admin/companies - ดึงข้อมูลบริษัททั้งหมดสำหรับ Admin
router.get('/', protect, adminCompanyController.getAllCompaniesForAdmin);

// GET /api/v1/admin/companies/:id - ดึงข้อมูลบริษัทเดียว (Super Admin)
router.get('/:id', protect, adminCompanyController.getCompanyByIdForAdmin);

// PATCH /api/v1/admin/companies/:id/status - อัปเดตสถานะบริษัท
router.patch('/:id/status', protect, adminCompanyController.updateCompanyStatus);

// DELETE /api/v1/admin/companies/:id - ลบบริษัท
router.delete('/:id', protect, adminCompanyController.deleteCompanyByAdmin);

module.exports = router;