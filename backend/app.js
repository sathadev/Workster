// app.js (เวอร์ชันใหม่สำหรับ API)

const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors'); // <-- 1. เพิ่มเข้ามา

const app = express();
const PORT = 5000; // <-- 4. (แนะนำ) เปลี่ยน Port เป็น 5000

// Middleware ที่จำเป็น
app.use(cors({
    origin: "http://localhost:5173", // 1. อนุญาตเฉพาะ Origin นี้เท่านั้น
    credentials: true               // 2. อนุญาตให้ส่ง Cookie ข้าม Origin ได้
}));// <-- 1. ใช้งาน CORS เพื่อให้ Frontend เรียกได้
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Session Middleware (ยังใช้ได้ แต่ในอนาคตอาจเปลี่ยนเป็น JWT)
app.use(session({
  secret: 'mySecretKey123',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 }
}));


// Routes
const authRoute = require('./routes/authRoute');
const EmpRoute = require('./routes/employeeRoutes');
const HrRoute = require('./routes/HrRoute');
const jobposRoutes = require('./routes/jobposRoutes');
const leaveTypesRoutes = require('./routes/leaveTypesRoutes');
const leaveworkRoutes = require('./routes/leaveworkRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const aboutRoutes = require('./routes/aboutRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// ----- 3. ปรับปรุงการเรียกใช้ Routes ให้มี Prefix /api/v1 -----
const API_PREFIX = '/api/v1';


app.use(`${API_PREFIX}/employees`, EmpRoute); // อาจจะเปลี่ยน path ให้สื่อความหมายมากขึ้น
app.use(`${API_PREFIX}/hr`, HrRoute);
app.use(`${API_PREFIX}/positions`, jobposRoutes);
app.use(`${API_PREFIX}/auth`, authRoute);
app.use(`${API_PREFIX}/salaries`, salaryRoutes);
app.use(`${API_PREFIX}/evaluations`, evaluationRoutes);
app.use(`${API_PREFIX}/settings`, aboutRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/leave-types`, leaveTypesRoutes);
app.use(`${API_PREFIX}/leave-requests`, leaveworkRoutes);
// -------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`API Server started at http://localhost:${PORT}`);
});