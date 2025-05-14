const Employee = require('../models/employeeModel');
const multer = require('multer');
const upload = multer();  // กำหนดให้ multer ใช้สำหรับรับไฟล์

// แสดงรายชื่อพนักงานทั้งหมด
exports.list = (req, res) => {
  Employee.getAll((err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    res.render('employee/index', { employees: results });
  });
};

// แสดงรายละเอียดพนักงาน
exports.view = (req, res) => {
  Employee.getById(req.params.id, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      console.error('Employee not found');
      return res.status(404).send('Not found');
    }
    res.render('employee/view', { employee: results[0] });
  });
};

// แสดงฟอร์มแก้ไขข้อมูลพนักงาน
exports.editForm = (req, res) => {
  Employee.getById(req.params.id, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      console.error('Employee not found');
      return res.status(404).send('Not found');
    }
    res.render('employee/edit', { employee: results[0] });
  });
};

// อัปเดตข้อมูลพนักงาน
exports.update = (req, res) => {
  const data = req.body;
  const emp_id = req.params.id;

  // ดึงข้อมูลพนักงานเดิมก่อน เพื่อใช้รูปเดิมถ้าไม่ได้อัปโหลดใหม่
  Employee.getById(emp_id, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      return res.status(404).send('Employee not found');
    }

    const existingEmployee = results[0];
    const emp_pic = req.file ? req.file.buffer : existingEmployee.emp_pic;

    const fullData = {
      ...data,
      emp_pic
    };

    Employee.update(emp_id, fullData, (err) => {
      if (err) {
        console.error('Update error:', err.message || err);
        return res.status(500).send('Update error');
      }
      res.redirect(`/employee/view/${emp_id}`);
    });
  });
};


// แสดงฟอร์มเพิ่มพนักงาน
exports.addForm = (req, res) => {
  res.render('employee/add');
};

// สร้างพนักงานใหม่
exports.create = upload.single('emp_pic'); // Middleware สำหรับไฟล์
exports.createHandler = (req, res) => {
  const data = req.body;
  const emp_pic = req.file ? req.file.buffer : null;

  const fullData = {
    ...data,
    emp_pic
  };

  Employee.create(fullData, (err, result) => {
    if (err) {
      console.error('Create error:', err.message || err);
      return res.status(500).send('Create error: ' + (err.message || err));
    }
    res.redirect('/employee');
  });
};

// ลบพนักงาน
exports.delete = (req, res) => {
  Employee.delete(req.params.id, (err) => {
    if (err) {
      console.error('Delete error:', err.message || err);
      return res.status(500).send('Delete error: ' + (err.message || err));
    }
    res.redirect('/employee');
  });
};
