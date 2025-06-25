// backend/controllers/employeeController.js

const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveworkModel');
const bcrypt = require('bcrypt');
const multer = require('multer');

const upload = multer();
exports.uploadImage = upload.single('emp_pic');

// [GET] /api/v1/employees - ดึงข้อมูลพนักงานทั้งหมด
exports.getAllEmployees = async (req, res) => {
    try {
        const result = await Employee.getAll(req.query);
        res.status(200).json(result);
    } catch (err) {
        console.error('API Error [getAllEmployees]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน' });
    }
};


// [GET] /api/v1/employees/:id - ดึงข้อมูลพนักงานรายบุคคล (ฉบับแก้ไข)
exports.getEmployeeById = async (req, res) => {
    try {
        const empId = req.params.id;

        const employeeResults = await Employee.getById(empId);

        if (!employeeResults || !employeeResults.length) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
        }

        const [attendanceCounts, approvedLeaveCount] = await Promise.all([
            Attendance.getCountSummary(empId),
            Leave.getApprovedLeaveCountByEmpId(empId)
        ]);
        
        const attendanceSummary = { ontimeCheckin: 0, lateCheckin: 0, ontimeCheckout: 0, lateCheckout: 0 };
        
        // --- ส่วนที่แก้ไข ---
        // เพิ่มการตรวจสอบก่อนเรียกใช้ forEach และตรวจสอบค่า null ก่อนใช้ .toLowerCase()
        if (attendanceCounts && Array.isArray(attendanceCounts)) {
            attendanceCounts.forEach(row => {
                const status = row.attendance_status ? row.attendance_status.toLowerCase() : '';
                const type = row.attendance_type ? row.attendance_type.toLowerCase() : '';

                if (status === 'ontime' && type === 'checkin') attendanceSummary.ontimeCheckin = row.count;
                else if (status === 'late' && type === 'checkin') attendanceSummary.lateCheckin = row.count;
                else if (status === 'ontime' && type === 'checkout') attendanceSummary.ontimeCheckout = row.count;
                // ในโค้ดเดิมของคุณมี typo ผมได้แก้เป็น 'early' ตาม ENUM ใน database schema
                else if (status === 'early' && type === 'checkout') attendanceSummary.lateCheckout = row.count; 
            });
        }
        // --- จบส่วนแก้ไข ---

        res.status(200).json({
            employee: employeeResults[0],
            attendanceSummary,
            approvedLeaveCount: approvedLeaveCount || 0 // ป้องกันค่า null
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

        if (!data.emp_password) {
            return res.status(400).json({ message: 'กรุณากรอกรหัสผ่าน' });
        }
        
        const hashedPassword = await bcrypt.hash(data.emp_password, 10);
        const fullData = { ...data, emp_password: hashedPassword, emp_pic };

        const newEmployee = await Employee.create(fullData);

        res.status(201).json({
            message: 'สร้างพนักงานใหม่สำเร็จ',
            data: newEmployee
        });
    } catch (err) {
        console.error('API Error [createEmployee]:', err);
        res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดในการสร้างพนักงาน' });
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

        // ไม่ควรอัปเดตรหัสผ่านและ username ในฟังก์ชันนี้
        const { emp_password, emp_username, ...updateData } = data; 
        const fullData = { ...updateData, emp_pic };
        
        await Employee.update(emp_id, fullData);
        const [updatedEmployee] = await Employee.getById(emp_id);

        res.status(200).json(updatedEmployee);
    } catch (err) {
        console.error('API Error [updateEmployee]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

// [DELETE] /api/v1/employees/:id - ลบพนักงาน
exports.deleteEmployee = async (req, res) => {
    try {
        const empIdToDelete = parseInt(req.params.id, 10);
        const loggedInEmpId = req.user.emp_id; 

        if (empIdToDelete === loggedInEmpId) {
            return res.status(403).json({ message: 'คุณไม่สามารถลบตัวเองได้' });
        }

        await Employee.delete(empIdToDelete);
        res.status(200).json({ message: `ลบพนักงาน ID: ${empIdToDelete} สำเร็จ` });
    } catch (err) {
        console.error('API Error [deleteEmployee]:', err);
        res.status(500).json({ message: 'ไม่สามารถลบพนักงานได้' });
    }
};


// [GET] /api/v1/profile - แสดงหน้า Profile ของพนักงานที่ล็อกอินอยู่
exports.viewProfile = async (req, res) => {
    req.params.id = req.user.emp_id;
    return exports.getEmployeeById(req, res);
};
