// backend/controllers/employeeController.js

const Employee = require('../models/employeeModel');
const Attendance = require('../models/attendanceModel');
const Leave = require('../models/leaveworkModel');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path'); // นำเข้าโมดูล 'path' สำหรับจัดการเส้นทางไฟล์
const fs = require('fs');     // นำเข้าโมดูล 'fs' สำหรับจัดการไฟล์และโฟลเดอร์

// กำหนด Storage สำหรับ Multer ให้บันทึกไฟล์ลงบน Disk
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // กำหนดโฟลเดอร์ปลายทางสำหรับเก็บรูปภาพโปรไฟล์
        // จะเก็บที่ backend/public/uploads/profile_pics/
        const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics');
        
        // ตรวจสอบว่าโฟลเดอร์มีอยู่หรือไม่ ถ้าไม่มีให้สร้างขึ้นมา
        // { recursive: true } จะสร้างโฟลเดอร์ย่อยทั้งหมดที่จำเป็น
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir); // ระบุโฟลเดอร์ปลายทาง
    },
    filename: (req, file, cb) => {
        // ตั้งชื่อไฟล์ให้ไม่ซ้ำกัน เพื่อป้องกันไฟล์ซ้ำทับกัน
        // ใช้ emp_id (จาก req.user ที่มาจาก protect middleware) + timestamp + นามสกุลไฟล์เดิม
        const empId = req.user.emp_id; 
        const ext = path.extname(file.originalname); // ดึงนามสกุลไฟล์เดิม
        const newFileName = `employee-${empId}-${Date.now()}${ext}`; // ตัวอย่าง: employee-4-1678888888888.jpg
        cb(null, newFileName); // กำหนดชื่อไฟล์ใหม่
    }
});

// กำหนดเงื่อนไขการอัปโหลดไฟล์ (ประเภทไฟล์, ขนาด)
const fileFilter = (req, file, cb) => {
    // ตรวจสอบ MIME type ของไฟล์ว่าเป็นรูปภาพหรือไม่
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // อนุญาตให้อัปโหลด
    } else {
        // ไม่อนุญาต และส่งข้อความผิดพลาด
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, GIF) เท่านั้น!'), false); 
    }
};

// สร้าง instance ของ multer ด้วยการตั้งค่า storage และ fileFilter
const upload = multer({
    storage: storage,       // ใช้ storage ที่กำหนดไว้ด้านบน
    fileFilter: fileFilter, // ใช้ filter ที่กำหนดไว้
    limits: { fileSize: 5 * 1024 * 1024 } // จำกัดขนาดไฟล์ไม่เกิน 5 MB (5 * 1024 * 1024 bytes)
});

// Middleware สำหรับการอัปโหลดรูปภาพโปรไฟล์เดี่ยว
// 'emp_pic' คือชื่อ field ใน FormData ที่ Frontend ส่งมา
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
        // req.file จะมีข้อมูลไฟล์ที่อัปโหลด (ถ้ามี)
        // เราจะเก็บแค่ชื่อไฟล์ลงในฐานข้อมูล
        const emp_pic_filename = req.file ? req.file.filename : null; 

        if (!data.emp_password) {
            // ถ้าไม่มีรหัสผ่าน ให้ลบไฟล์ที่อาจถูกอัปโหลดไปแล้วทิ้ง (ถ้ามี)
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete uploaded file due to missing password:", unlinkErr);
                });
            }
            return res.status(400).json({ message: 'กรุณากรอกรหัสผ่าน' });
        }
        
        const hashedPassword = await bcrypt.hash(data.emp_password, 10);
        // ส่งชื่อไฟล์แทน buffer ของรูปภาพ
        const fullData = { ...data, emp_password: hashedPassword, emp_pic: emp_pic_filename };

        // สร้างพนักงานใหม่ พร้อมส่ง companyId เพื่อระบุว่าพนักงานคนนี้สังกัดบริษัทใด
        const newEmployee = await Employee.create(fullData, req.companyId);

        res.status(201).json({
            message: 'สร้างพนักงานใหม่สำเร็จ',
            data: newEmployee
        });
    } catch (err) {
        console.error('API Error [createEmployee]:', err);
        // ถ้าเกิด Error หลังอัปโหลดไฟล์แล้ว แต่ก่อนบันทึก DB (เช่น DB Error)
        // ควรลบไฟล์ที่อัปโหลดไปแล้วทิ้ง เพื่อไม่ให้มีไฟล์ขยะตกค้าง
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Failed to delete uploaded file after DB error:", unlinkErr);
            });
        }
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
            // ถ้าไม่พบพนักงานในบริษัทนี้ ให้ลบไฟล์ที่อาจถูกอัปโหลดใหม่ทิ้ง (ถ้ามี)
            if (req.file) {
                fs.unlink(req.file.path, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete newly uploaded file due to employee not found:", unlinkErr);
                });
            }
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่จะอัปเดต' });
        }

        const existingEmployee = results[0];
        let emp_pic_filename = existingEmployee.emp_pic; // ค่าเริ่มต้นคือชื่อไฟล์รูปเดิมใน DB

        if (req.file) { // ถ้ามีการอัปโหลดไฟล์รูปใหม่
            // ลบรูปเก่าทิ้งก่อน (ถ้ามี) เพื่อไม่ให้มีไฟล์ขยะตกค้าง
            if (existingEmployee.emp_pic) {
                const oldFilePath = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics', existingEmployee.emp_pic);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete old profile pic:", unlinkErr);
                });
            }
            emp_pic_filename = req.file.filename; // ใช้ชื่อไฟล์ใหม่ที่ Multer สร้างให้
        } else if (data.emp_pic_removed === 'true') { // เพิ่ม Logic ถ้า Frontend ส่ง flag มาว่าลบรูป
            // ถ้า Frontend บอกว่ารูปถูกลบ และมีรูปเก่าอยู่
            if (existingEmployee.emp_pic) {
                const oldFilePath = path.join(__dirname, '..', 'public', 'uploads', 'profile_pics', existingEmployee.emp_pic);
                fs.unlink(oldFilePath, (unlinkErr) => {
                    if (unlinkErr) console.error("Failed to delete old profile pic (explicit remove):", unlinkErr);
                });
            }
            emp_pic_filename = null; // ตั้งค่าใน DB เป็น NULL
        }
        // ถ้าไม่มี req.file และ data.emp_pic_removed ไม่ใช่ 'true'
        // emp_pic_filename จะยังคงเป็นค่าเดิมจาก DB (existingEmployee.emp_pic)

        const { emp_password, emp_username, ...updateData } = data;
        // ส่งชื่อไฟล์ (หรือ null) แทน buffer ของรูปภาพ
        const fullData = { ...updateData, emp_pic: emp_pic_filename };
        
        // อัปเดตข้อมูลพนักงาน พร้อมส่ง companyId
        await Employee.update(emp_id, fullData, req.companyId);
        
        // ดึงข้อมูลพนักงานที่อัปเดตแล้วกลับไป
        const [updatedEmployee] = await Employee.getById(emp_id, req.companyId);

        res.status(200).json(updatedEmployee);
    } catch (err) {
        console.error('API Error [updateEmployee]:', err);
        // ถ้าเกิด Error หลังอัปโหลดไฟล์ใหม่แล้ว แต่ก่อนบันทึก DB (เช่น DB Error)
        // ควรลบไฟล์ที่อัปโหลดใหม่นั้นทิ้ง
        if (req.file) {
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) console.error("Failed to delete newly uploaded file due to update error:", unlinkErr);
            });
        }
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
};

// [DELETE] /api/v1/employees/:id - ลบพนักงาน
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

        // ลบไฟล์รูปภาพเก่าก่อนลบข้อมูลพนักงานจาก DB
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

// [GET] /api/v1/profile - แสดงหน้า Profile ของพนักงานที่ล็อกอินอยู่
exports.viewProfile = async (req, res) => {
    // กำหนด emp_id ของผู้ใช้ที่ล็อกอินไปยัง req.params.id เพื่อให้สามารถเรียกใช้ getEmployeeById ได้
    req.params.id = req.user.emp_id;
    // req.companyId จะถูกส่งต่อไปยัง getEmployeeById โดยอัตโนมัติจาก protect middleware
    return exports.getEmployeeById(req, res);
};
