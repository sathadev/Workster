// app.js (เวอร์ชันใหม่สำหรับ JWT)
const express = require('express');
const path = require('path');
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

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// app.use((req, res, next) => {
//     console.log('--- Detective Middleware ---');
//     console.log('Request Path:', req.path);
//     console.log('Request Headers:', req.headers);
//     console.log('Request Body (after parsing):', req.body);
//     console.log('--------------------------');
//     next(); // ส่งต่อไปยัง Middleware หรือ Route ตัวถัดไป
// });

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
app.use(`${API_PREFIX}/employees`, EmpRoute); // อาจจะเปลี่ยน path ให้สื่อความหมายมากขึ้น
app.use(`${API_PREFIX}/positions`, jobposRoutes);
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