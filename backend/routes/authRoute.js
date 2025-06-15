const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');
const util = require('util');

// ทำให้ db.query สามารถใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

// แสดงหน้า login
router.get('/login', (req, res) => {
  // หาก login อยู่แล้วให้ redirect ไปหน้าแรก
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

// ตรวจสอบการเข้าสู่ระบบ
router.post('/login', async (req, res) => {
  try {
    const { emp_username, emp_password } = req.body;

    // 1. ค้นหาผู้ใช้จาก username
    const results = await query('SELECT * FROM employee WHERE emp_username = ?', [emp_username]);

    if (results.length === 0) {
      return res.render('login', { error: 'ไม่พบบัญชีผู้ใช้นี้' });
    }

    const user = results[0];

    // 2. เปรียบเทียบรหัสผ่าน
    const isMatch = await bcrypt.compare(emp_password, user.emp_password);

    if (!isMatch) {
      return res.render('login', { error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    // 3. หากถูกต้อง ให้สร้าง session
    req.session.user = user;
    req.session.emp_id = user.emp_id; // เก็บ emp_id แยกไว้เพื่อความสะดวก

    console.log('Login successful for user:', req.session.user.emp_name);

    // 4. Redirect ไปยังหน้าหลัก
    res.redirect('/');

  } catch (err) {
    console.error('Login process error:', err);
    res.render('login', { error: 'เกิดข้อผิดพลาดในระบบ' });
  }
});

// ออกจากระบบ
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    // หลังจากทำลาย session แล้ว ให้ redirect ไปยังหน้า login
    res.redirect('/login');
  });
});

module.exports = router;