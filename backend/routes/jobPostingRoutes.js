// backend/routes/jobPostingRoutes.js
const express = require('express');
const router = express.Router();
const jobPostingController = require('../controllers/jobPostingController');
const { protect } = require('../middleware/authMiddleware'); // สำหรับ routes ที่ต้องมีการยืนยันตัวตน

// --- Public Routes (ไม่ต้อง Login) ---
// ต้องวางไว้ก่อน protected routes เพื่อไม่ให้เกิด route conflict
// GET /api/v1/job-postings/public - ดึงประกาศทั้งหมดที่ Active (สำหรับผู้สมัคร)
router.get('/public', jobPostingController.getPublicJobPostings);

// GET /api/v1/job-postings/public/:id - ดึงประกาศเดียวที่ Active (สำหรับผู้สมัคร)
router.get('/public/:id', jobPostingController.getPublicJobPostingById);

// --- Protected Routes (ต้อง Login) ---
// GET /api/v1/job-postings - ดึงประกาศทั้งหมด (HR/Admin)
router.get('/', protect, jobPostingController.getAllJobPostings);

// GET /api/v1/job-postings/:id - ดึงประกาศเดียว (HR/Admin)
router.get('/:id', protect, jobPostingController.getJobPostingById);

// POST /api/v1/job-postings - สร้างประกาศใหม่ (HR/Admin)
router.post('/', protect, jobPostingController.createJobPosting);

// PUT /api/v1/job-postings/:id - อัปเดตประกาศ (HR/Admin)
router.put('/:id', protect, jobPostingController.updateJobPosting);

// DELETE /api/v1/job-postings/:id - ลบประกาศ (HR/Admin)
router.delete('/:id', protect, jobPostingController.deleteJobPosting);

module.exports = router;
