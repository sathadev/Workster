const express = require('express');
const router = express.Router();
const db = require('../db');

// router.get('/employee', (req, res) => {
//   res.render('employee/index'); 
// });

router.get('/employee/view', (req, res) => {
  res.render('employee/view'); 
});

router.get('/employee/edit', (req, res) => {
  res.render('employee/edit'); 
});

router.get('/employee/add', (req, res) => {
  res.render('employee/add'); 
});


router.get('/employee', (req, res) => {
  db.query('SELECT * FROM employee', (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).send('Database error');
    }
    res.render('employee/index', { employees: results });
  });
});


router.get('/employee/view/:id', async (req, res) => {
  const empId = req.params.id;

  // ดึงข้อมูลพนักงานจากฐานข้อมูล
  db.query('SELECT * FROM employee WHERE emp_id = ?', [empId], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).send('Database error');
    }

    if (results.length > 0) {
      const employee = results[0];
      res.render('employee/view', { employee });  // ส่งข้อมูลไปยัง view
    } else {
      res.status(404).send('Employee not found');
    }
  });
});

// การแสดงหน้าแก้ไขข้อมูลพนักงาน
router.get('/employee/edit/:id', async (req, res) => {
  const empId = req.params.id;

  // ดึงข้อมูลพนักงานจากฐานข้อมูล
  db.query('SELECT * FROM employee WHERE emp_id = ?', [empId], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).send('Database error');
    }

    if (results.length > 0) {
      const employee = results[0];
      res.render('employee/edit', { employee });  // ส่งข้อมูลไปยัง view
    } else {
      res.status(404).send('Employee not found');
    }
  });
});

router.post('/employee/edit/:id', (req, res) => {
  const empId = req.params.id;

  // รับข้อมูลจาก req.body
  const { emp_name, emp_jobpos, emp_email, emp_tel, emp_address } = req.body;

  // คำสั่ง SQL สำหรับการอัปเดตข้อมูลพนักงาน
  const query = 'UPDATE employee SET emp_name = ?, emp_jobpos = ?, emp_email = ?, emp_tel = ?, emp_address = ? WHERE emp_id = ?';

  db.query(query, [emp_name, emp_jobpos, emp_email, emp_tel, emp_address, empId], (err, results) => {
    if (err) {
      console.error('Query error:', err);
      return res.status(500).send('Database error');
    }

    // เมื่ออัปเดตเสร็จแล้ว Redirect ไปยังหน้ารายละเอียดพนักงาน
    res.redirect(`/employee/view/${empId}`);
  });
});

router.post('/employee/add', (req, res) => {
  const {
    emp_name,
    emp_jobpos,
    emp_email,
    emp_tel,
    emp_address,
    emp_username,
    emp_password
  } = req.body;

  const sql = `
    INSERT INTO employee
    (emp_name, emp_jobpos, emp_email, emp_tel, emp_address, emp_username, emp_password)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    emp_name,
    emp_jobpos,
    emp_email,
    emp_tel,
    emp_address,
    emp_username,
    emp_password
  ], (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการบันทึก:', err);
      res.status(500).send('เกิดข้อผิดพลาด');
    } else {
      console.log('เพิ่มพนักงานใหม่เรียบร้อย:', result.insertId);
      res.redirect(`/employee`);
    }
  });
});


router.post('/employee/delete/:id', (req, res) => {
  const empId = req.params.id;

  db.query('DELETE FROM employee WHERE emp_id = ?', [empId], (err, result) => {
    if (err) {
      console.error('ลบข้อมูลล้มเหลว:', err);
      return res.status(500).send('เกิดข้อผิดพลาดในการลบ');
    }

    console.log('ลบพนักงานสำเร็จ:', empId);
    res.redirect('/employee');
  });
});


module.exports = router;
