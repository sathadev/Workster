const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer'); // ยังคงต้อง import multer เพื่อใช้ใน Error handling
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware ที่จำเป็น
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true 
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// **สำคัญมาก:** ต้องตั้งค่าให้ Express สามารถเข้าถึงไฟล์ที่อัปโหลดได้
app.use('/uploads/profile_pics', express.static(path.join(__dirname, 'public', 'uploads', 'profile_pics')));
app.use('/uploads/resumes', express.static(path.join(__dirname, 'public', 'uploads', 'resumes')));

// Import routes
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

const { protect } = require('./middleware/authMiddleware');

const API_PREFIX = '/api/v1';

// --- Public Routes (ไม่ต้อง protect) ---
app.use(`${API_PREFIX}/auth`, authRoute); 
app.use(`${API_PREFIX}/job-postings`, jobPostingRoutes); 
app.use(`${API_PREFIX}/positions`, jobposRoutes); 
app.use(`${API_PREFIX}/job-applications`, jobApplicationRoutes); // <-- ใช้ route module ใหม่

// --- Protected Routes (ต้อง protect) ---
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
app.use(`${API_PREFIX}/hr/applicants`, require('./routes/hrApplicantRoutes'));

// Error handling middleware สำหรับ multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Max 5MB allowed.' });
        }
    }
    if (error.message === 'Only PDF, DOC, and DOCX files are allowed!') {
        return res.status(400).json({ message: error.message });
    }
    next(error);
});

app.listen(PORT, () => {
    console.log(`API Server started at http://localhost:${PORT}`);
});