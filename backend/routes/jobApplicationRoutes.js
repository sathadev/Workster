const express = require('express');
const router = express.Router();
const jobApplicationController = require('../controllers/jobApplicationController');
const upload = require('../middleware/uploadMiddleware');

// Route สำหรับรับใบสมัคร
// ใช้ upload.single('resume_file') เป็น middleware สำหรับการอัปโหลดไฟล์เดียว
router.post('/:jobPostingId', upload.single('resume_file'), jobApplicationController.createJobApplication);

module.exports = router;