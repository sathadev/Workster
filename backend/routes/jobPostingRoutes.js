// backend/routes/jobPostingRoutes.js
// Route สำหรับจัดการประกาศรับสมัครงาน (Public และ HR/Admin)

const express = require('express');
const router = express.Router();
const jobPostingController = require('../controllers/jobPostingController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/job-postings/public
// ดึงข้อมูลประกาศรับสมัครงานทั้งหมดที่เปิดอยู่ (Active)
// ใช้สำหรับผู้สมัครงานทั่วไป (ไม่ต้องล็อกอิน)
router.get('/public', jobPostingController.getPublicJobPostings);

// [GET] /api/v1/job-postings/public/:id
// ดึงข้อมูลประกาศรับสมัครงานเฉพาะรายการที่เปิดอยู่ (Active)
// ใช้สำหรับหน้ารายละเอียดประกาศงานของผู้สมัครงานทั่วไป
router.get('/public/:id', jobPostingController.getPublicJobPostingById);

// [GET] /api/v1/job-postings
// ดึงข้อมูลประกาศรับสมัครงานทั้งหมดของบริษัท (HR/Admin)
router.get('/', protect, jobPostingController.getAllJobPostings);

// [GET] /api/v1/job-postings/:id
// ดึงข้อมูลประกาศรับสมัครงานเฉพาะรายการ (HR/Admin)
router.get('/:id', protect, jobPostingController.getJobPostingById);

// [POST] /api/v1/job-postings
// สร้างประกาศรับสมัครงานใหม่ (HR/Admin)
router.post('/', protect, jobPostingController.createJobPosting);

// [PUT] /api/v1/job-postings/:id
// อัปเดตข้อมูลประกาศรับสมัครงาน (HR/Admin)
router.put('/:id', protect, jobPostingController.updateJobPosting);

// [DELETE] /api/v1/job-postings/:id
// ลบประกาศรับสมัครงานออกจากระบบ (HR/Admin)
router.delete('/:id', protect, jobPostingController.deleteJobPosting);

module.exports = router;
