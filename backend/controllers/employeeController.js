// backend/controllers/employeeController.js
// Controller สำหรับจัดการข้อมูลพนักงาน (Employee)
// เช่น การสร้าง แก้ไข ลบ ดึงข้อมูล และอัปโหลดรูปโปรไฟล์พนักงาน

const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveworkModel');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path'); // นำเข้าโมดูล 'path' สำหรับจัดการเส้นทางไฟล์
const fs = require('fs');     // นำเข้าโมดูล 'fs' สำหรับจัดการไฟล์และโฟลเดอร์

// ตั้งค่าการเก็บไฟล์สำหรับ Multer (จัดเก็บไฟล์ลง Disk)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // กำหนดโฟลเดอร์ปลายทางสำหรับเก็บรูปภาพโปรไฟล์
        // จะเก็บที่ backend/public/uploads/profile_pics/
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics');

        // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่ ถ้าไม่มีให้สร้างใหม่
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ไม่ให้ซ้ำ โดยใช้ emp_id + timestamp + นามสกุลเดิม
        const empId = req.user.emp_id;
        const ext = path.extname(file.originalname);
        const newFileName = `employee-${empId}-${Date.now()}${ext}`;
        cb(null, newFileName);
    }
});

// ฟิลเตอร์การอัปโหลดไฟล์ (ตรวจสอบประเภท)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF) เท่านั้น!'), false);
    }
};

// ตั้งค่า Multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ 5 MB
});

// Middleware สำหรับอัปโหลดรูปโปรไฟล์พนักงาน
exports.uploadImage = upload.single('emp_pic');

// [GET] /api/v1/employees
// ดึงข้อมูลพนักงานทั้งหมด (รองรับ filter, sort, pagination)
exports.getAllEmployees = async (req, res) => {
    try {
        const result = await Employee.getAll(req.query, req.companyId);
        res.status(200).json(result);
    } catch (err) {
        console.error('API Error [getAllEmployees]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน' });
    }
};

// [GET] /api/v1/employees/:id
// ดึงข้อมูลพนักงานรายบุคคล พร้อมสรุปการลงเวลาและวันลาที่อนุมัติ
exports.getEmployeeById = async (req, res) => {
    try {
        const empId = req.params.id;
        const employeeResults = await Employee.getById(empId, req.companyId);

        if (!employeeResults || employeeResults.length === 0) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงาน' });
        }

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

// [POST] /api/v1/employees
// เพิ่มข้อมูลพนักงานใหม่ พร้อมอัปโหลดรูปภาพโปรไฟล์
exports.createEmployee = async (req, res) => {
    try {
        const data = req.body;
        const emp_pic_filename = req.file ? req.file.filename : null;

        if (!data.emp_password) {
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete uploaded file due to missing password:", unlinkErr);
                });
            }
            return res.status(400).json({ message: 'กรุณากรอกรหัสผ่าน' });
        }

        const hashedPassword = await bcrypt.hash(data.emp_password, 10);
        const fullData = { ...data, emp_password: hashedPassword, emp_pic: emp_pic_filename };
        const newEmployee = await Employee.create(fullData, req.companyId);

        res.status(201).json({
            message: 'สร้างพนักงานใหม่สำเร็จ',
            data: newEmployee
        });
    } catch (err) {
        console.error('API Error [createEmployee]:', err);
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Failed to delete uploaded file after DB error:", unlinkErr);
            });
        }
        res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดในการสร้างพนักงาน' });
    }
};

// [PUT] /api/v1/employees/:id
// อัปเดตข้อมูลพนักงาน (รวมถึงรูปโปรไฟล์ใหม่หรือการลบรูป)
exports.updateEmployee = async (req, res) => {
    try {
        const emp_id = req.params.id;
        const data = req.body;

        const results = await Employee.getById(emp_id, req.companyId);
        if (!results.length) {
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete newly uploaded file due to employee not found:", unlinkErr);
                });
            }
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่จะอัปเดต' });
        }

        const existingEmployee = results[0];
        let emp_pic_filename = existingEmployee.emp_pic;

        if (req.file) {
            if (existingEmployee.emp_pic) {
                const oldFilePath = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics', existingEmployee.emp_pic);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete old profile pic:", unlinkErr);
                });
            }
            emp_pic_filename = req.file.filename;
        } else if (data.emp_pic_removed === 'true') {
            if (existingEmployee.emp_pic) {
                const oldFilePath = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics', existingEmployee.emp_pic);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete old profile pic (explicit remove):", unlinkErr);
                });
            }
            emp_pic_filename = null;
        }

        const { emp_password, emp_username, ...updateData } = data;
        const fullData = { ...updateData, emp_pic: emp_pic_filename };

        await Employee.update(emp_id, fullData, req.companyId);
        const [updatedEmployee] = await Employee.getById(emp_id, req.companyId);

        res.status(200).json(updatedEmployee);
    } catch (err) {
        console.error('API Error [updateEmployee]:', err);
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Failed to delete newly uploaded file due to update error:", unlinkErr);
            });
        }
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

// [DELETE] /api/v1/employees/:id
// ลบข้อมูลพนักงาน พร้อมลบไฟล์รูปภาพที่เกี่ยวข้อง
exports.deleteEmployee = async (req, res) => {
    try {
        const empIdToDelete = parseInt(req.params.id, 10);
        const loggedInEmpId = req.user.emp_id;
        const loggedInCompanyId = req.companyId;

        const employeeToDelete = await Employee.getById(empIdToDelete, loggedInCompanyId);
        if (!employeeToDelete || employeeToDelete.length === 0) {
            return res.status(404).json({ message: 'ไม่พบพนักงานในบริษัทของคุณที่จะลบ' });
        }

        if (empIdToDelete === loggedInEmpId) {
            return res.status(403).json({ message: 'คุณไม่สามารถลบตัวเองได้' });
        }

        if (employeeToDelete[0].emp_pic) {
            const filePath = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics', employeeToDelete[0].emp_pic);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error("Failed to delete profile pic during employee deletion:", unlinkErr);
            });
        }

        await Employee.delete(empIdToDelete, loggedInCompanyId);
        res.status(200).json({ message: `ลบพนักงาน ID: ${empIdToDelete} สำเร็จ` });
    } catch (err) {
        console.error('API Error [deleteEmployee]:', err);
        res.status(500).json({ message: 'ไม่สามารถลบพนักงานได้' });
    }
};

// [GET] /api/v1/profile
// ดึงข้อมูลโปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่ (Re-use getEmployeeById)
exports.viewProfile = async (req, res) => {
    req.params.id = req.user.emp_id;
    return exports.getEmployeeById(req, res);
};
