// backend/routes/authRoute.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // ตรวจสอบ Path ให้ถูกต้อง
const bcrypt = require('bcrypt');
const util = require('util');

const query = util.promisify(db.query).bind(db);

// --- 1. ลบ Route GET /login ทิ้งไป เพราะ Frontend จะจัดการหน้าฟอร์มเอง ---
// router.get('/login', ...);


// [POST] /api/v1/auth/login - ตรวจสอบการเข้าสู่ระบบ
router.post('/login', async (req, res) => {
  try {
    const { emp_username, emp_password } = req.body;

    if (!emp_username || !emp_password) {
        return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    // 1. ค้นหาผู้ใช้จาก username
    const results = await query('SELECT * FROM employee WHERE emp_username = ?', [emp_username]);

    // CHANGED: สำหรับ API ควรตอบกลับด้วย 401 Unauthorized เพื่อความปลอดภัย
    // ไม่ควรบอกว่า "ไม่พบบัญชี" หรือ "รหัสผิด" เพื่อป้องกันการเดาชื่อผู้ใช้
    if (results.length === 0) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const user = results[0];

    // 2. เปรียบเทียบรหัสผ่าน
    const isMatch = await bcrypt.compare(emp_password, user.emp_password);

    if (!isMatch) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // 3. หากถูกต้อง ให้สร้าง session
    // CHANGED: กรองรหัสผ่านออกก่อนที่จะบันทึกลง session และส่งกลับ
    const { emp_password: _, ...safeUser } = user;
    req.session.user = safeUser; 
    
    console.log('Login successful for user:', req.session.user.emp_name);

    // 4. CHANGED: ส่งข้อมูลผู้ใช้ (ที่ไม่มีรหัสผ่าน) กลับไปเป็น JSON
    res.status(200).json({
      message: 'เข้าสู่ระบบสำเร็จ',
      user: safeUser
    });

  } catch (err) {
    console.error('Login process error:', err);
    // CHANGED: ส่ง Error กลับไปเป็น JSON
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// [GET] /api/v1/auth/logout - ออกจากระบบ
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการออกจากระบบ' });
    }
    
    // CHANGED: ส่งข้อความยืนยันการออกจากระบบกลับไปเป็น JSON
    res.clearCookie('connect.sid'); // ล้างคุกกี้ฝั่ง client ด้วย
    res.status(200).json({ message: 'ออกจากระบบสำเร็จ' });
  });
});

module.exports = router;