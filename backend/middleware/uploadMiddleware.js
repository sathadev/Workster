// backend/middleware/uploadMiddleware.js
// ใช้สำหรับจัดการการอัปโหลดไฟล์ (เช่น Resume, เอกสารสมัครงาน)
// รองรับเฉพาะไฟล์ .pdf, .doc, .docx และจำกัดขนาดไม่เกิน 5 MB

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// กำหนดพื้นที่จัดเก็บไฟล์และรูปแบบการตั้งชื่อ
const storage = multer.diskStorage({
  // ตำแหน่งโฟลเดอร์ปลายทางที่เก็บไฟล์
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '..', 'public', 'uploads', 'resumes');

    // ตรวจสอบว่ามีโฟลเดอร์หรือไม่ ถ้าไม่มีให้สร้างใหม่
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },

  // ตั้งชื่อไฟล์แบบไม่ซ้ำ โดยใช้ jobPostingId + timestamp + random number
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    const jobPostingId = req.params.jobPostingId || 'unknown';
    cb(null, `resume_${jobPostingId}_${uniqueSuffix}${fileExtension}`);
  },
});

// ตรวจสอบประเภทไฟล์ที่อนุญาตให้อัปโหลด
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('รองรับเฉพาะไฟล์ PDF, DOC, และ DOCX เท่านั้น!'), false);
  }
};

// ตั้งค่าตัวอัปโหลดหลัก
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไฟล์ไม่เกิน 5 MB
});

module.exports = upload;
