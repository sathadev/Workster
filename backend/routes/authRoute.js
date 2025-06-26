// backend/routes/authRoute.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const util = require('util');
const jwt = require('jsonwebtoken'); 

const { protect } = require('../middleware/authMiddleware'); // <-- 2. เราจะสร้าง Middleware ตัวใหม่

const query = util.promisify(db.query).bind(db);

// [POST] /api/v1/auth/login
router.post('/login', async (req, res) => {
    try {
        const { emp_username, emp_password } = req.body;
        // ... โค้ดตรวจสอบ username, password เหมือนเดิม ...
        if (!emp_username || !emp_password) return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        const results = await query('SELECT * FROM employee WHERE emp_username = ?', [emp_username]);
        if (results.length === 0) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        const user = results[0];
        const isMatch = await bcrypt.compare(emp_password, user.emp_password);
        if (!isMatch) return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        
        // --- ส่วนที่เปลี่ยนแปลง ---
        // 3. สร้าง JWT Token
        const payload = { id: user.emp_id }; // ใส่ข้อมูลที่จำเป็นลงใน Token
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const { emp_password: _, ...safeUser } = user;

        // 4. ส่ง Token และข้อมูล user กลับไป
        res.status(200).json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token: token,
            user: safeUser
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// [GET] /api/v1/auth/logout
router.get('/logout', (req, res) => {
    // ในระบบ JWT, Logout คือการที่ Client ลบ Token ทิ้ง Backend ไม่ต้องทำอะไร
    res.status(200).json({ message: 'Logout request received' });
});

// [GET] /api/v1/auth/profile - ใช้สำหรับตรวจสอบ Token
router.get('/profile', protect, (req, res) => {
    // Middleware `protect` ตัวใหม่จะหา user จาก Token และแนบมาให้ที่ `req.user`
    res.status(200).json(req.user);
});

module.exports = router;