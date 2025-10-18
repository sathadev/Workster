// backend/routes/jobApplicationRoutes.js
const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const upload = require('../middleware/uploadMiddleware');

// [POST] /api/v1/job-applications/:jobPostingId
// ใช้สำหรับให้ผู้สมัครส่งใบสมัครเข้ามา (พร้อมไฟล์ Resume)
// ใช้ upload.single('resume_file') เพื่อจัดการอัปโหลดไฟล์เดียว
router.post('/:jobPostingId', upload.single('resume_file'), jobApplicationController.createJobApplication);

module.exports = router;
