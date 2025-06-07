const Employee = require('../models/employeeModel');
const Jobpos = require('../models/jobposModel');
const Attendance = require('../models/attendanceModel');  // ปรับ path ตามโครงสร้างโปรเจกต์คุณ

const multer = require('multer');
const upload = multer();  // กำหนดให้ multer ใช้สำหรับรับไฟล์
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');


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
  const empId = req.params.id;

  Employee.getById(empId, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      console.error('Employee not found');
      return res.status(404).send('Not found');
    }

    Attendance.getCountSummary(empId, (err, attendanceCounts) => {
      if (err) {
        console.error('Attendance count error:', err);
        return res.status(500).send('Attendance count error');
      }

      // แปลงผลลัพธ์ให้ง่ายขึ้น เช่น
      const summary = {
        ontimeCheckIn: 0,
        lateCheckIn: 0,
        ontimeCheckOut: 0,
        lateCheckOut: 0
      };

      attendanceCounts.forEach(row => {
        const key = row.attendance_status + row.attendance_type.charAt(0).toUpperCase() + row.attendance_type.slice(1);
        summary[key] = row.count;
      });

      res.render('employee/view', {
        employee: results[0],
        attendanceSummary: summary
      });
    });
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

      // เช็คว่ามีคนครองตำแหน่งประธานบริษัทอยู่ไหม
      Employee.getByJobposName(chairmanJobName, (err, chairmanEmployees) => {
        if (err) {
          console.error('Error checking chairman:', err);
          return res.status(500).send('Error checking chairman');
        }

        // ถ้ามีคนครองตำแหน่งนี้ และไม่ใช่คนที่เราจะแก้ ให้ตัด 'ประธานบริษัท' ออก
        if (chairmanEmployees.length > 0) {
          positions = positions.filter(pos => {
            if (pos.jobpos_name !== chairmanJobName) return true;
            return chairmanEmployees[0].emp_id === empId;
          });
        }

        res.render('employee/edit', {
          employee: empResults[0],
          positions: positions
        });
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
// ตั้งค่าชื่อตำแหน่งประธานบริษัทไว้ใช้ทุกที่
const chairmanJobName = 'ประธานบริษัท';

// แสดงฟอร์มเพิ่มพนักงาน
exports.addForm = (req, res) => {
  Jobpos.getAll((err, positions) => {
    if (err) return res.status(500).send('Error loading positions');

    // เช็คว่ามีคนครองตำแหน่งประธานบริษัทหรือยัง
    Employee.getByJobposName(chairmanJobName, (err, chairmanEmployees) => {
      if (err) return res.status(500).send('Error checking chairman');

      // ถ้ามีคนครองอยู่แล้ว กรองเอาตำแหน่ง 'ประธานบริษัท' ออก
      if (chairmanEmployees.length > 0) {
        positions = positions.filter(pos => pos.jobpos_name !== chairmanJobName);
      }

      res.render('employee/add', { positions, employee: null });
    });
  });
};



exports.create = upload.single('emp_pic'); // Middleware สำหรับไฟล์

exports.createHandler = async (req, res) => {
  const data = req.body;
  let emp_pic = req.file ? req.file.buffer : null;

  try {
    if (!emp_pic) {
      const defaultImagePath = path.join(__dirname, '../public/images/profile.jpg');
      emp_pic = fs.readFileSync(defaultImagePath); // โหลดรูป default มาเป็น buffer
    }

    const hashedPassword = await bcrypt.hash(data.emp_password, 10);

    const fullData = {
      ...data,
      emp_password: hashedPassword,
      emp_pic,
      emp_birthday: data.emp_birthday
    };

    Employee.create(fullData, (err, result) => {
      if (err) {
        console.error('Create error:', err.message || err);
        return res.status(500).send('Create error: ' + (err.message || err));
      }
      res.redirect('/employee');
    });
  } catch (err) {
    console.error('Error:', err.message || err);
    res.status(500).send('Error occurred: ' + (err.message || err));
  }
};


// ลบพนักงาน
exports.delete = (req, res) => {
  const empIdToDelete = parseInt(req.params.id);
  const loggedInEmpId = req.session.user.emp_id;

  if (empIdToDelete === loggedInEmpId) {
    return res.status(403).send('คุณไม่สามารถลบตัวเองได้');
  }

  Employee.delete(empIdToDelete, (err) => {
    if (err) {
      return res.status(500).send('ไม่สามารถลบพนักงานได้');
    }
    res.redirect('/employee');
  });
};

exports.viewProfile = (req, res) => {
  const empId = req.session.user.emp_id;

  Employee.getById(empId, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      console.error('Employee not found');
      return res.status(404).send('Not found');
    }

    Attendance.getCountSummary(empId, (err, attendanceCounts) => {
      if (err) {
        console.error('Attendance count error:', err);
        return res.status(500).send('Attendance count error');
      }

      // แปลง attendanceCounts เป็น object camelCase keys
      const attendanceSummary = {
        ontimeCheckin: 0,
        lateCheckin: 0,
        ontimeCheckout: 0,
        lateCheckout: 0,
      };

      attendanceCounts.forEach(item => {
        const status = item.attendance_status.toLowerCase();
        const type = item.attendance_type.toLowerCase();

        if (status === 'ontime' && type === 'checkin') attendanceSummary.ontimeCheckin = item.count;
        else if (status === 'late' && type === 'checkin') attendanceSummary.lateCheckin = item.count;
        else if (status === 'ontime' && type === 'checkout') attendanceSummary.ontimeCheckout = item.count;
        else if (status === 'late' && type === 'checkout') attendanceSummary.lateCheckout = item.count;
      });

      res.render('employee/view', {
        employee: results[0],
        attendanceSummary
      });
    });
  });
};
