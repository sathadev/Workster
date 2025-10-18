// backend/routes/jobposRoutes.js
const express = require('express');
const router = express.Router();
const jobposController = require('../controllers/jobposController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/positions/public
// ดึงตำแหน่งงาน (Job Positions) แบบ Public
// ใช้สำหรับให้ผู้สมัครทั่วไป (ไม่ต้องล็อกอิน) เรียกดู
router.get('/public', jobposController.getPublicPositions);

// ===== Protected Routes =====
// ทุกเส้นทางด้านล่างนี้ต้องผ่านการตรวจสอบสิทธิ์ก่อน (JWT)
router.use(protect);

// [GET] /api/v1/positions
// ดึงตำแหน่งงานทั้งหมด (Global + ของบริษัทตนเอง)
router.get('/', jobposController.getAllPositions);

// [GET] /api/v1/positions/:id
// ดึงข้อมูลตำแหน่งงานตาม ID
router.get('/:id', jobposController.getPositionById);

// [POST] /api/v1/positions
// สร้างตำแหน่งงานใหม่ (บริษัทตนเองเท่านั้น)
router.post('/', jobposController.createPosition);

// [PUT] /api/v1/positions/:id
// แก้ไขข้อมูลตำแหน่งงาน
router.put('/:id', jobposController.updatePosition);

// [DELETE] /api/v1/positions/:id
// ลบตำแหน่งงาน
router.delete('/:id', jobposController.deletePosition);

module.exports = router;
