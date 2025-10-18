// backend/app.js
// -----------------------------------------------------------------------------
// Main Application Entry (Express Server)
// หน้าที่: ตั้งค่าระบบหลักของ Backend เช่น Middleware, Routes, และ Static Files
// -----------------------------------------------------------------------------

const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// -----------------------------------------------------------------------------
// Middleware พื้นฐาน
// -----------------------------------------------------------------------------

// เปิดใช้งาน CORS เพื่อให้ frontend (React) ที่รันบน localhost:5173 เข้าถึง API ได้
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// รองรับการรับข้อมูลจาก body ทั้งแบบ JSON และ URL Encoded
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// -----------------------------------------------------------------------------
// Static File Serving
// ตั้งค่าเส้นทางให้ Express สามารถเข้าถึงไฟล์ที่อัปโหลดได้จาก public/
// -----------------------------------------------------------------------------
app.use('/uploads/profile_pics', express.static(path.join(__dirname, 'public', 'uploads', 'profile_pics')));
app.use('/uploads/resumes', express.static(path.join(__dirname, 'public', 'uploads', 'resumes')));

// -----------------------------------------------------------------------------
// Import Routes ทั้งหมดของระบบ
// -----------------------------------------------------------------------------
const authRoute = require('./routes/authRoute');
const EmpRoute = require('./routes/employeeRoutes');
const jobposRoutes = require('./routes/jobposRoutes');
const leaveTypesRoutes = require('./routes/leaveTypesRoutes');
const leaveworkRoutes = require('./routes/leaveworkRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminCompanyRoutes = require('./routes/adminCompanyRoutes');
const jobPostingRoutes = require('./routes/jobPostingRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const hrApplicantRoutes = require('./routes/hrApplicantRoutes');
const { protect } = require('./middleware/authMiddleware');

// กำหนด Prefix ของทุก API
const API_PREFIX = '/api/v1';

// -----------------------------------------------------------------------------
// Public Routes (ไม่ต้อง Login เข้าถึงได้)
// -----------------------------------------------------------------------------
app.use(`${API_PREFIX}/auth`, authRoute);
app.use(`${API_PREFIX}/job-postings`, jobPostingRoutes);
app.use(`${API_PREFIX}/positions`, jobposRoutes);
app.use(`${API_PREFIX}/job-applications`, jobApplicationRoutes);

// -----------------------------------------------------------------------------
// Protected Routes (ต้องผ่าน JWT ตรวจสอบสิทธิ์ก่อนเข้าถึง)
// -----------------------------------------------------------------------------
app.use(protect);

app.use(`${API_PREFIX}/employees`, EmpRoute);
app.use(`${API_PREFIX}/salaries`, salaryRoutes);
app.use(`${API_PREFIX}/evaluations`, evaluationRoutes);
app.use(`${API_PREFIX}/settings`, aboutRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/leave-types`, leaveTypesRoutes);
app.use(`${API_PREFIX}/leave-requests`, leaveworkRoutes);
app.use(`${API_PREFIX}/companies`, companyRoutes);
app.use(`${API_PREFIX}/admin/companies`, adminCompanyRoutes);
app.use(`${API_PREFIX}/hr/applicants`, hrApplicantRoutes);

// -----------------------------------------------------------------------------
// Error Handling สำหรับ Multer (Upload)
// -----------------------------------------------------------------------------
app.use((error, req, res, next) => {
    // ตรวจจับ Error กรณีไฟล์ใหญ่เกินกำหนด
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Max 5MB allowed.' });
        }
    }

    // ตรวจจับ Error กรณีอัปโหลดไฟล์ประเภทที่ไม่อนุญาต
    if (error.message === 'Only PDF, DOC, and DOCX files are allowed!') {
        return res.status(400).json({ message: error.message });
    }

    // ส่งต่อ error ให้ middleware อื่นถ้ามี
    next(error);
});

// -----------------------------------------------------------------------------
// เริ่มรัน Server ที่ PORT กำหนดไว้ใน .env (default: 5000)
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`API Server started at http://localhost:${PORT}`);
});
