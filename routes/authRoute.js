const express = require('express');
const router = express.Router();
const db = require('../config/db');  // ปรับตาม config จริงของคุณ
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { emp_username, emp_password } = req.body;

  db.query('SELECT * FROM employee WHERE emp_username = ?', [emp_username], async (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      const match = await bcrypt.compare(emp_password, result[0].emp_password);
      if (match) {
        req.session.user = result[0];
        return res.redirect('/');
      } else {
        return res.render('login', { error: 'รหัสผ่านไม่ถูกต้อง' });
      }
    } else {
      return res.render('login', { error: 'ไม่พบบัญชีผู้ใช้' });
    }
  });
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
