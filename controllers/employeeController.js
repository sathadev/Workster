const Employee = require('../models/employeeModel');
const Jobpos = require('../models/jobposModel');
const multer = require('multer');
const upload = multer();  // กำหนดให้ multer ใช้สำหรับรับไฟล์
const bcrypt = require('bcrypt');

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
  const empId = req.params.id;

  Employee.getById(empId, (err, empResults) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!empResults.length) {
      return res.status(404).send('Employee not found');
    }

    Jobpos.getAll((err, positions) => {
      if (err) {
        console.error('Error loading positions:', err);
        return res.status(500).send('Error loading positions');
      }

      res.render('employee/edit', {
        employee: empResults[0],
        positions: positions  // ส่ง positions ไปด้วย
      });
    });
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
  Jobpos.getAll((err, positions) => {
    if (err) return res.status(500).send('Error loading positions');
    res.render('employee/add', { positions, employee: null });  // ส่ง employee: null
  });
};



exports.create = upload.single('emp_pic'); // Middleware สำหรับไฟล์

exports.createHandler = async (req, res) => {
  const data = req.body;
  const emp_pic = req.file ? req.file.buffer : null;

  try {
    // เข้ารหัสรหัสผ่านก่อน
    const hashedPassword = await bcrypt.hash(data.emp_password, 10); // 10 คือ salt rounds

    const fullData = {
      ...data,
      emp_password: hashedPassword, // แทนที่ด้วยรหัสผ่านที่ถูกเข้ารหัสแล้ว
      emp_pic
    };

    Employee.create(fullData, (err, result) => {
      if (err) {
        console.error('Create error:', err.message || err);
        return res.status(500).send('Create error: ' + (err.message || err));
      }
      res.redirect('/employee');
    });
  } catch (err) {
    console.error('Hashing error:', err.message || err);
    res.status(500).send('Error hashing password');
  }
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
