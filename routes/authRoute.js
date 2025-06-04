const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcrypt');

// หน้า login
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// ตรวจสอบการเข้าสู่ระบบ
router.post('/login', (req, res) => {
  const { emp_username, emp_password } = req.body;

  db.query('SELECT * FROM employee WHERE emp_username = ?', [emp_username], async (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.render('login', { error: 'เกิดข้อผิดพลาดในระบบ' });
    }

    if (result.length > 0) {
      const user = result[0];
      const match = await bcrypt.compare(emp_password, user.emp_password);

      if (match) {
        // ✅ เก็บ user และ emp_id ลงใน session
        req.session.user = user;
        req.session.emp_id = user.emp_id;

        console.log('Login success:', req.session.user); // สำหรับ debug

        return res.redirect('/');
      } else {
        return res.render('login', { error: 'รหัสผ่านไม่ถูกต้อง' });
      }
    } else {
      return res.render('login', { error: 'ไม่พบบัญชีผู้ใช้' });
    }
  });
});

// ออกจากระบบ
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/login');
  });
});

module.exports = router;
