const Employee = require('../models/employeeModel');
const Jobpos = require('../models/jobposModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveworkModel');

const multer = require('multer');
const upload = multer();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// ตั้งค่าชื่อตำแหน่งประธานบริษัทไว้ใช้ทุกที่
const chairmanJobName = 'ประธานบริษัท';

// แสดงรายชื่อพนักงานทั้งหมด (รวมการค้นหาและเรียงลำดับ)
exports.list = async (req, res) => {
  const { sort: sortField = 'emp_name', order = 'asc', search: searchTerm = '' } = req.query;
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  try {
    let employees;
    if (searchTerm.trim()) {
      employees = await Employee.searchEmployees(searchTerm.trim());
    } else {
      employees = await Employee.getAllSorted(sortField, sortOrder);
    }

    res.render('employee/index', {
      employees,
      sortField,
      sortOrder,
      searchTerm,
      error: null
    });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).render('employee/index', {
      employees: [],
      sortField,
      sortOrder,
      searchTerm,
      error: 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน'
    });
  }
};

// แสดงรายละเอียดพนักงาน
exports.view = async (req, res) => {
  try {
    const empId = req.params.id;
    const employeeResults = await Employee.getById(empId);

    if (!employeeResults.length) {
      return res.status(404).send('Employee not found');
    }

    // ดึงข้อมูลพร้อมกันเพื่อประสิทธิภาพที่ดีขึ้น
    const [attendanceCounts, approvedLeaveCount] = await Promise.all([
      Attendance.getCountSummary(empId),
      Leave.getApprovedLeaveCountByEmpId(empId)
    ]);

    const attendanceSummary = {
      ontimeCheckin: 0,
      lateCheckin: 0,
      ontimeCheckout: 0, // <-- แก้ไข Bug จาก lateCheckout เป็น ontimeCheckout
      lateCheckout: 0
    };

    attendanceCounts.forEach(row => {
      const status = row.attendance_status.toLowerCase();
      const type = row.attendance_type.toLowerCase();

      if (status === 'ontime' && type === 'checkin') attendanceSummary.ontimeCheckin = row.count;
      else if (status === 'late' && type === 'checkin') attendanceSummary.lateCheckin = row.count;
      else if (status === 'ontime' && type === 'checkout') attendanceSummary.ontimeCheckout = row.count; // <-- แก้ไข Bug
      else if (status === 'late' && type === 'checkout') attendanceSummary.lateCheckout = row.count;
    });

    res.render('employee/view', {
      employee: employeeResults[0],
      attendanceSummary,
      approvedLeaveCount
    });

  } catch (err) {
    console.error('Error fetching employee details:', err);
    res.status(500).send('Server error');
  }
};

// แสดงฟอร์มแก้ไขข้อมูลพนักงาน
exports.editForm = async (req, res) => {
  try {
    const empId = parseInt(req.params.id, 10);
    const [employee, allPositions, chairmanEmployees] = await Promise.all([
      Employee.getById(empId),
      Jobpos.getAll(),
      Employee.getByJobposName(chairmanJobName)
    ]);
    
    if (!employee.length) {
      return res.status(404).send('Employee not found');
    }

    let availablePositions = allPositions;
    // ถ้ามีคนเป็นประธานแล้ว และไม่ใช่คนที่เรากำลังจะแก้ ให้กรองตำแหน่งประธานออก
    if (chairmanEmployees.length > 0 && chairmanEmployees[0].emp_id !== empId) {
      availablePositions = allPositions.filter(pos => pos.jobpos_name !== chairmanJobName);
    }
    
    res.render('employee/edit', {
      employee: employee[0],
      positions: availablePositions
    });

  } catch (err) {
    console.error('Error loading edit form:', err);
    res.status(500).send('Error loading data');
  }
};

// อัปเดตข้อมูลพนักงาน
exports.update = async (req, res) => {
  try {
    const emp_id = req.params.id;
    const data = req.body;
    
    const results = await Employee.getById(emp_id);
    if (!results.length) {
      return res.status(404).send('Employee not found');
    }

    const existingEmployee = results[0];
    const emp_pic = req.file ? req.file.buffer : existingEmployee.emp_pic;

    const fullData = { ...data, emp_pic };
    delete fullData.emp_password; // ไม่ควรอัปเดตรหัสผ่านในฟอร์มนี้โดยตรง

    await Employee.update(emp_id, fullData);
    res.redirect(`/employee/view/${emp_id}`);

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).send('Update error');
  }
};

// แสดงฟอร์มเพิ่มพนักงาน
exports.addForm = async (req, res) => {
  try {
    const [positions, chairmanEmployees] = await Promise.all([
        Jobpos.getAll(),
        Employee.getByJobposName(chairmanJobName)
    ]);
    
    let availablePositions = positions;
    if (chairmanEmployees.length > 0) {
      availablePositions = positions.filter(pos => pos.jobpos_name !== chairmanJobName);
    }

    res.render('employee/add', { positions: availablePositions, employee: null });
  } catch (err) {
    console.error('Error loading add form:', err);
    res.status(500).send('Error loading positions');
  }
};

// Middleware สำหรับรับไฟล์
exports.create = upload.single('emp_pic');

// Handler สำหรับสร้างพนักงานใหม่
exports.createHandler = async (req, res) => {
  try {
    const data = req.body;
    let emp_pic = req.file ? req.file.buffer : null;

    if (!emp_pic) {
      const defaultImagePath = path.join(__dirname, '../public/images/profile.jpg');
      emp_pic = fs.readFileSync(defaultImagePath);
    }

    const hashedPassword = await bcrypt.hash(data.emp_password, 10);

    const fullData = {
      ...data,
      emp_password: hashedPassword,
      emp_pic,
    };

    await Employee.create(fullData); // แก้ไข: ใช้ await แทน callback
    res.redirect('/employee');

  } catch (err) {
    console.error('Create error:', err);
    res.status(500).send('Create error: ' + (err.message || err));
  }
};

// ลบพนักงาน
exports.delete = async (req, res) => {
  try {
    const empIdToDelete = parseInt(req.params.id, 10);
    const loggedInEmpId = req.session.user.emp_id;

    if (empIdToDelete === loggedInEmpId) {
      return res.status(403).send('คุณไม่สามารถลบตัวเองได้');
    }

    await Employee.delete(empIdToDelete);
    res.redirect('/employee');
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).send('ไม่สามารถลบพนักงานได้');
  }
};

// แสดงหน้า Profile ของพนักงานที่ล็อกอินอยู่
exports.viewProfile = async (req, res) => {
    try {
        const empId = req.session.user.emp_id;
        const employeeResults = await Employee.getById(empId);

        if (!employeeResults.length) {
            return res.status(404).send('Employee not found');
        }

        const [attendanceCounts, approvedLeaveCount] = await Promise.all([
            Attendance.getCountSummary(empId),
            Leave.getApprovedLeaveCountByEmpId(empId)
        ]);

        const attendanceSummary = {
            ontimeCheckin: 0,
            lateCheckin: 0,
            ontimeCheckout: 0, // <-- แก้ไข Bug
            lateCheckout: 0
        };

        attendanceCounts.forEach(item => {
            const status = item.attendance_status.toLowerCase();
            const type = item.attendance_type.toLowerCase();

            if (status === 'ontime' && type === 'checkin') attendanceSummary.ontimeCheckin = item.count;
            else if (status === 'late' && type === 'checkin') attendanceSummary.lateCheckin = item.count;
            else if (status === 'ontime' && type === 'checkout') attendanceSummary.ontimeCheckout = item.count; // <-- แก้ไข Bug
            else if (status === 'late' && type === 'checkout') attendanceSummary.lateCheckout = item.count;
        });

        res.render('employee/profile', {
            employee: employeeResults[0],
            attendanceSummary,
            approvedLeaveCount
        });

    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).send('Server error');
    }
};

// ฟังก์ชัน searchEmployees เดิมไม่จำเป็นแล้ว เพราะถูกรวมเข้าไปใน exports.list แล้ว
// หากต้องการแยก endpoint ไว้ สามารถใช้โค้ดด้านล่างนี้ได้
/*
exports.searchEmployees = async (req, res) => {
  const { search: searchTerm, sort: sortField = 'emp_name', order = 'asc' } = req.query;
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  if (!searchTerm || !searchTerm.trim()) {
      return res.redirect('/employee');
  }

  try {
      const employees = await Employee.searchEmployees(searchTerm.trim());
      res.render('employee/index', {
          employees,
          searchTerm,
          error: null,
          sortField,
          sortOrder
      });
  } catch (err) {
      console.error('Search error:', err);
      res.status(500).render('employee/index', {
          employees: [],
          searchTerm,
          error: 'เกิดข้อผิดพลาดในการค้นหา',
          sortField,
          sortOrder
      });
  }
};
*/