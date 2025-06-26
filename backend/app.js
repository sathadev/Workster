// backend/app.js

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// 1. Import http และ socket.io
const http = require('http');
const { initSocket } = require('./socket');

const app = express();
// 2. สร้าง http Server จาก express app
const httpServer = http.createServer(app);
// 3. เริ่มการทำงานของ Socket.IO และส่ง httpServer เข้าไป
const io = initSocket(httpServer);

const PORT = process.env.PORT || 5000;

// Middleware ที่จำเป็น (ลำดับถูกต้องแล้ว)
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true 
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// --- Routes ---
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

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoute);
app.use(`${API_PREFIX}/employees`, EmpRoute);
app.use(`${API_PREFIX}/positions`, jobposRoutes);
app.use(`${API_PREFIX}/salaries`, salaryRoutes);
app.use(`${API_PREFIX}/evaluations`, evaluationRoutes);
app.use(`${API_PREFIX}/settings`, aboutRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/leave-types`, leaveTypesRoutes);
app.use(`${API_PREFIX}/leave-requests`, leaveworkRoutes);

// --- ส่วนสำหรับรันเซิร์ฟเวอร์ ---
// 4. เปลี่ยนมาใช้ httpServer.listen() แทน app.listen()
httpServer.listen(PORT, () => {
    console.log(`🚀 API Server with Socket.IO started at http://localhost:${PORT}`);
});
