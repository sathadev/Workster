const Employee = require('../models/employeeModel');
const Jobpos = require('../models/jobposModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveworkModel');

const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Middleware สำหรับจัดการไฟล์ภาพ (แยกออกมาเพื่อให้นำไปใช้ใน Route ได้ง่าย)
const upload = multer();
exports.uploadImage = upload.single('emp_pic');

// --- ฟังก์ชันสำหรับ API ---

// [GET] /api/v1/employees - ดึงข้อมูลพนักงานทั้งหมด (รวมการค้นหาและเรียงลำดับ)
exports.getAllEmployees = async (req, res) => {
  const { sort: sortField = 'emp_name', order = 'asc', search: searchTerm = '' } = req.query;
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    let employees;
    if (searchTerm.trim()) {
      employees = await Employee.searchEmployees(searchTerm.trim());
    } else {
      // NOTE: แนะนำให้เพิ่ม Pagination ใน Model เพื่อประสิทธิภาพในอนาคต
      employees = await Employee.getAllSorted(sortField, sortOrder);
    }
    // CHANGED: ส่งข้อมูลพนักงานเป็น JSON กลับไป
    res.status(200).json(employees);
  } catch (err) {
    console.error('API Error [getAllEmployees]:', err);
    // CHANGED: ส่ง Error เป็น JSON กลับไป
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน' });
  }
};

// [GET] /api/v1/employees/:id - ดึงข้อมูลพนักงานรายบุคคล
exports.getEmployeeById = async (req, res) => {
  try {
    const empId = req.params.id;
    const employeeResults = await Employee.getById(empId);

    // CHANGED: จัดการเคส 404 Not Found
    if (!employeeResults.length) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
    }

    const [attendanceCounts, approvedLeaveCount] = await Promise.all([
      Attendance.getCountSummary(empId),
      Leave.getApprovedLeaveCountByEmpId(empId)
    ]);
    
    // ... (ส่วน Logic การคำนวณข้อมูลสรุปยังคงเหมือนเดิม)
    const attendanceSummary = { ontimeCheckin: 0, lateCheckin: 0, ontimeCheckout: 0, lateCheckout: 0 };
    attendanceCounts.forEach(row => {
      const status = row.attendance_status.toLowerCase();
      const type = row.attendance_type.toLowerCase();
      if (status === 'ontime' && type === 'checkin') attendanceSummary.ontimeCheckin = row.count;
      else if (status === 'late' && type === 'checkin') attendanceSummary.lateCheckin = row.count;
      else if (status === 'ontime' && type === 'checkout') attendanceSummary.ontimeCheckout = row.count;
      else if (status === 'late' && type === 'checkout') attendanceSummary.lateCheckout = row.count;
    });

    // CHANGED: รวบทุกอย่างส่งกลับเป็น JSON ก้อนเดียว
    res.status(200).json({
      employee: employeeResults[0],
      attendanceSummary,
      approvedLeaveCount
    });
  } catch (err) {
    console.error('API Error [getEmployeeById]:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน' });
  }
};

// [POST] /api/v1/employees - สร้างพนักงานใหม่
exports.createEmployee = async (req, res) => {
  try {
    const data = req.body;
    let emp_pic = req.file ? req.file.buffer : null;

    if (!emp_pic) {
      const defaultImagePath = path.join(__dirname, '../../public/images/profile.jpg'); // ปรับ path ให้ถูกต้อง
      emp_pic = fs.readFileSync(defaultImagePath);
    }

    const hashedPassword = await bcrypt.hash(data.emp_password, 10);
    const fullData = { ...data, emp_password: hashedPassword, emp_pic };

    const newEmployee = await Employee.create(fullData);

    // CHANGED: ส่งสถานะ 201 (Created) และข้อมูลที่สร้างใหม่กลับไป
    res.status(201).json({
      message: 'สร้างพนักงานใหม่สำเร็จ',
      data: newEmployee
    });
  } catch (err) {
    console.error('API Error [createEmployee]:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างพนักงาน: ' + err.message });
  }
};

// [PUT] /api/v1/employees/:id - อัปเดตข้อมูลพนักงาน
exports.updateEmployee = async (req, res) => {
  try {
    const emp_id = req.params.id;
    const data = req.body;
    
    const results = await Employee.getById(emp_id);
    if (!results.length) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่จะอัปเดต' });
    }

    const existingEmployee = results[0];
    const emp_pic = req.file ? req.file.buffer : existingEmployee.emp_pic;

    const fullData = { ...data, emp_pic };
    delete fullData.emp_password; // ไม่ควรอัปเดตรหัสผ่านในฟังก์ชันนี้

    await Employee.update(emp_id, fullData);
    const updatedEmployee = await Employee.getById(emp_id); // ดึงข้อมูลล่าสุดหลังอัปเดต

    // CHANGED: ส่งข้อมูลที่อัปเดตแล้วกลับไป
    res.status(200).json(updatedEmployee[0]);
  } catch (err) {
    console.error('API Error [updateEmployee]:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
};

// [DELETE] /api/v1/employees/:id - ลบพนักงาน
exports.deleteEmployee = async (req, res) => {
  try {
    const empIdToDelete = parseInt(req.params.id, 10);
    // const loggedInEmpId = req.session.user.emp_id; // Session อาจจะต้องปรับปรุงในอนาคต

    // if (empIdToDelete === loggedInEmpId) {
    //   return res.status(403).json({ message: 'คุณไม่สามารถลบตัวเองได้' });
    // }

    await Employee.delete(empIdToDelete);

    // CHANGED: ส่งข้อความยืนยันการลบสำเร็จ
    res.status(200).json({ message: `ลบพนักงาน ID: ${empIdToDelete} สำเร็จ` });
  } catch (err) {
    console.error('API Error [deleteEmployee]:', err);
    res.status(500).json({ message: 'ไม่สามารถลบพนักงานได้' });
  }
};


// [GET] /api/v1/profile - แสดงหน้า Profile ของพนักงานที่ล็อกอินอยู่
exports.viewProfile = async (req, res) => {
    try {
        const empId = req.session.user.emp_id; // ยังคงใช้ session ได้ในตอนนี้
        if (!empId) {
            return res.status(401).json({ message: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ' });
        }
        
        // (ส่วน Logic เหมือนกับ getEmployeeById แต่ใช้ empId จาก session)
        const employeeResults = await Employee.getById(empId);
        // ... (Logic การดึงข้อมูลอื่นๆ) ...

        // CHANGED: ส่งข้อมูล Profile เป็น JSON กลับไป
        res.status(200).json({
          employee: employeeResults[0],
          // ... attendanceSummary, approvedLeaveCount
        });
    } catch (err) {
        console.error('API Error [viewProfile]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์' });
    }
};

/*
  หมายเหตุ: ฟังก์ชันที่เกี่ยวกับ "การแสดงฟอร์ม" เช่น `addForm`, `editForm` 
  ได้ถูกลบออกไปแล้ว เพราะในสถาปัตยกรรมแบบใหม่ Frontend (React)
  จะเป็นผู้รับผิดชอบในการสร้างและแสดงฟอร์มขึ้นมาเองทั้งหมด
*/