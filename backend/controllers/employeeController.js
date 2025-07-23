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
        // ส่ง req.query (สำหรับ filter, sort, pagination) และ req.companyId ไปยัง Model
        const result = await Employee.getAll(req.query, req.companyId);
        res.status(200).json(result);
    } catch (err) {
        console.error('API Error [getAllEmployees]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน' });
    }
};

// [GET] /api/v1/employees/:id - ดึงข้อมูลพนักงานรายบุคคล
exports.getEmployeeById = async (req, res) => {
    try {
        const empId = req.params.id;

        // ดึงข้อมูลพนักงานโดยใช้ empId และ companyId เพื่อให้มั่นใจว่าพนักงานนั้นอยู่ในบริษัทเดียวกับผู้ใช้ที่ร้องขอ
        const employeeResults = await Employee.getById(empId, req.companyId);

        if (!employeeResults || employeeResults.length === 0) {
            // ถ้าไม่พบพนักงาน หรือพนักงานไม่อยู่ในบริษัทนี้ ถือว่าไม่พบข้อมูล
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
        }

        // ดึงข้อมูลสรุปการลงเวลาและวันลาที่อนุมัติแล้วของพนักงานคนนั้น ภายในขอบเขต companyId
        const [attendanceCounts, approvedLeaveCount] = await Promise.all([
            Attendance.getCountSummary(empId, req.companyId),
            Leave.getApprovedLeaveCountByEmpId(empId, req.companyId)
        ]);
        
        const attendanceSummary = { ontimeCheckin: 0, lateCheckin: 0, ontimeCheckout: 0, lateCheckout: 0 };
        
        if (attendanceCounts && Array.isArray(attendanceCounts)) {
            attendanceCounts.forEach(row => {
                const status = row.attendance_status ? row.attendance_status.toLowerCase() : '';
                const type = row.attendance_type ? row.attendance_type.toLowerCase() : '';

                if (status === 'ontime' && type === 'checkin') attendanceSummary.ontimeCheckin = row.count;
                else if (status === 'late' && type === 'checkin') attendanceSummary.lateCheckin = row.count;
                else if (status === 'ontime' && type === 'checkout') attendanceSummary.ontimeCheckout = row.count;
                else if (status === 'early' && type === 'checkout') attendanceSummary.lateCheckout = row.count;
            });
        }

        res.status(200).json({
            employee: employeeResults[0],
            attendanceSummary,
            approvedLeaveCount: approvedLeaveCount || 0
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

        // สร้างพนักงานใหม่ พร้อมส่ง companyId เพื่อระบุว่าพนักงานคนนี้สังกัดบริษัทใด
        const newEmployee = await Employee.create(fullData, req.companyId);

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
        
        // ดึงข้อมูลพนักงานเดิมเพื่อตรวจสอบ และนำรูปภาพเก่า (ถ้าไม่มีการอัปโหลดใหม่) มาใช้
        // ต้องกรองด้วย companyId เพื่อให้แน่ใจว่ากำลังอัปเดตพนักงานที่อยู่ในบริษัทเดียวกัน
        const results = await Employee.getById(emp_id, req.companyId);
        if (!results.length) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่จะอัปเดต' });
        }

        const existingEmployee = results[0];
        const emp_pic = req.file ? req.file.buffer : existingEmployee.emp_pic;

        // ไม่ควรอัปเดตรหัสผ่านและ username ผ่านฟังก์ชันนี้
        const { emp_password, emp_username, ...updateData } = data;
        const fullData = { ...updateData, emp_pic };
        
        // อัปเดตข้อมูลพนักงาน พร้อมส่ง companyId
        await Employee.update(emp_id, fullData, req.companyId);
        
        // ดึงข้อมูลพนักงานที่อัปเดตแล้วกลับไป
        const [updatedEmployee] = await Employee.getById(emp_id, req.companyId);

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
        const loggedInCompanyId = req.companyId;

        // ตรวจสอบว่าพนักงานที่ต้องการลบอยู่ในบริษัทเดียวกันกับผู้ใช้ที่ล็อกอินหรือไม่
        const employeeToDelete = await Employee.getById(empIdToDelete, loggedInCompanyId);
        if (!employeeToDelete || employeeToDelete.length === 0) {
            return res.status(404).json({ message: 'ไม่พบพนักงานในบริษัทของคุณที่จะลบ' });
        }

        // ห้ามลบตัวเอง
        if (empIdToDelete === loggedInEmpId) {
            return res.status(403).json({ message: 'คุณไม่สามารถลบตัวเองได้' });
        }

        // ลบพนักงาน พร้อมส่ง companyId เพื่อให้แน่ใจว่าลบได้เฉพาะพนักงานในบริษัทตัวเอง
        await Employee.delete(empIdToDelete, loggedInCompanyId);
        res.status(200).json({ message: `ลบพนักงาน ID: ${empIdToDelete} สำเร็จ` });
    } catch (err) {
        console.error('API Error [deleteEmployee]:', err);
        res.status(500).json({ message: 'ไม่สามารถลบพนักงานได้' });
    }
};

// [GET] /api/v1/profile - แสดงหน้า Profile ของพนักงานที่ล็อกอินอยู่
exports.viewProfile = async (req, res) => {
    // กำหนด emp_id ของผู้ใช้ที่ล็อกอินไปยัง req.params.id เพื่อให้สามารถเรียกใช้ getEmployeeById ได้
    req.params.id = req.user.emp_id;
    // req.companyId จะถูกส่งต่อไปยัง getEmployeeById โดยอัตโนมัติจาก protect middleware
    return exports.getEmployeeById(req, res);
};