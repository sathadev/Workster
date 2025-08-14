// app.js (เวอร์ชันใหม่สำหรับ JWT)
const express = require('express');
const multer = require('multer');
const path = require('path'); // เพิ่ม path module
const cors = require('cors');
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

// <<<<<<< ส่วนใหม่: Multer Storage Configuration >>>>>>>
// กำหนดที่เก็บไฟล์ Resume/CV
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'public', 'uploads', 'resumes'); // <<<<< แก้ไข path ให้ถูกต้อง
        // ตรวจสอบว่าโฟลเดอร์มีอยู่จริงหรือไม่ ถ้าไม่มีให้สร้าง (ต้องใช้ fs-extra หรือ fs.promises.mkdir)
        // หรือสร้างด้วยมือ: mkdir -p public/uploads/resumes
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ใหม่: application_IDประกาศงาน_timestamp.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        // jobPostingId จะถูกส่งมาใน req.params.jobPostingId จาก route
        const jobPostingId = req.params.jobPostingId || 'unknown'; 
        cb(null, `resume_${jobPostingId}_${uniqueSuffix}${fileExtension}`);
    }
});

const fileFilter = (req, file, cb) => {
    // กรองประเภทไฟล์ที่อนุญาต
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true); // อนุญาต
    } else {
        cb(new Error('Only PDF, DOC, and DOCX files are allowed!'), false); // ไม่อนุญาต
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});
// <<<<<<< สิ้นสุด Multer Configuration >>>>>>>

// <<<<<<< ส่วนใหม่: Job Application Controller >>>>>>>
const jobApplicationController = require('./controllers/jobApplicationController'); 
// <<<<<<< สิ้นสุด Job Application Controller >>>>>>>


// **สำคัญมาก:** ต้องตั้งค่าให้ Express สามารถเข้าถึงไฟล์ที่อัปโหลดได้
// app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'))); // อันนี้มีอยู่แล้ว
app.use('/uploads/resumes', express.static(path.join(__dirname, 'public', 'uploads', 'resumes'))); // <<<<< เพิ่ม static path สำหรับ resumes

// ... (Detective Middleware ถ้าคุณยังใช้) ...

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

const { protect } = require('./middleware/authMiddleware'); // <-- Import protect middleware ที่นี่

const API_PREFIX = '/api/v1';

// --- Public Routes (ไม่ต้อง protect) ---
// ต้องวางไว้ก่อน app.use(protect, ...)
app.use(`${API_PREFIX}/auth`, authRoute); 
app.use(`${API_PREFIX}/job-postings`, jobPostingRoutes); 
app.use(`${API_PREFIX}/positions`, jobposRoutes); 

// <<<<<<< ส่วนใหม่: Public Route สำหรับ Job Applications >>>>>>>
// Route สำหรับรับใบสมัคร
// ใช้ upload.single('resume_file') เป็น middleware สำหรับการอัปโหลดไฟล์เดียว
app.post(`${API_PREFIX}/job-applications/:jobPostingId`, upload.single('resume_file'), jobApplicationController.createJobApplication);
// <<<<<<< สิ้นสุด Public Route สำหรับ Job Applications >>>>>>>


// --- Protected Routes (ต้อง protect) ---
app.use(protect); // <-- ใช้ protect middleware ที่นี่ เพื่อ protect routes ที่อยู่ข้างล่างทั้งหมด

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


// -------------------------------------------------------------

// <<<<<<< ส่วนใหม่: Error handling middleware สำหรับ multer (ถ้าต้องการแสดง error ให้ client) >>>>>>>
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File size too large. Max 5MB allowed.' });
        }
    }
    if (error.message === 'Only PDF, DOC, and DOCX files are allowed!') {
        return res.status(400).json({ message: error.message });
    }
    next(error); // ส่ง error ไปยัง error handler ถัดไป
});
// <<<<<<< สิ้นสุด Error handling middleware >>>>>>>


app.listen(PORT, () => {
    console.log(`API Server started at http://localhost:${PORT}`);
});