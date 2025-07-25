// backend/routes/authRoute.js
const express = require('express');
const router = express.Router();
const db = require('../config/db'); // สำหรับการ query database โดยตรง
const bcrypt = require('bcryptjs'); // ใช้ bcryptjs
const util = require('util');
const jwt = require('jsonwebtoken');

const { protect } = require('../middleware/authMiddleware'); // Middleware สำหรับ routes ที่ต้อง Protected

// Import Models ที่จำเป็นสำหรับ Public Registration Endpoint
const CompanyModel = require('../models/companyModel');   // Import CompanyModel
const EmployeeModel = require('../models/employeeModel'); // Import EmployeeModel

const query = util.promisify(db.query).bind(db); // ทำให้ db.query ใช้งานแบบ async/await ได้

// [POST] /api/v1/auth/login
router.post('/login', async (req, res) => {
    try {
        const { emp_username, emp_password } = req.body;
        if (!emp_username || !emp_password) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // Fetch user AND company status for login check
        const results = await query(`
            SELECT e.*, c.company_status 
            FROM employee e 
            JOIN companies c ON e.company_id = c.company_id 
            WHERE e.emp_username = ?`, [emp_username]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
        const user = results[0];

        // IMPORTANT: Check company_status during login (Approval Flow)
        if (user.company_status !== 'approved') {
            return res.status(403).json({ message: 'บริษัทของคุณยังไม่ได้รับการอนุมัติ โปรดติดต่อผู้ดูแลระบบ' });
        }

        const isMatch = await bcrypt.compare(emp_password, user.emp_password);
        if (!isMatch) {
            return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }

        // สร้าง JWT Token
        // เพิ่ม company_id และ jobpos_id ใน payload เพื่อให้ frontend AuthContext ใช้งานได้
        const payload = { id: user.emp_id, company_id: user.company_id, jobpos_id: user.jobpos_id };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        // ไม่ส่ง password และ company_status กลับไปเพื่อความปลอดภัย
        const { emp_password: _, company_status: __, ...safeUser } = user;

        res.status(200).json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token: token,
            user: safeUser
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ' });
    }
});

// [GET] /api/v1/auth/logout
router.get('/logout', (req, res) => {
    // ในระบบ JWT, Logout คือการที่ Client ลบ Token ทิ้ง Backend ไม่ต้องทำอะไร
    res.status(200).json({ message: 'Logout request received' });
});

// [GET] /api/v1/auth/profile - ใช้สำหรับตรวจสอบ Token
router.get('/profile', protect, (req, res) => {
    // Middleware `protect` จะหา user จาก Token และแนบมาให้ที่ `req.user`
    res.status(200).json(req.user);
});

// NEW: [POST] /api/v1/auth/public-register-company-admin - PUBLIC ROUTE (NO TOKEN REQUIRED)
// Endpoint นี้สำหรับขั้นตอนการสมัครบริษัทและ Admin คนแรก โดยเฉพาะ
router.post('/public-register-company-admin', async (req, res) => {
    try {
        const {
            username, email, password, // User credentials
            fullName, phone, empAddressNo, empMoo, empBuilding, // Employee address details
            empStreet, empSoi, empSubdistrict, empDistrict, empProvince, empZipCode,
            companyName, companyAddressNo, companyMoo, companyBuilding, // Company details
            companyStreet, companySoi, companySubdistrict, companyDistrict,
            companyProvince, companyZipCode, companyPhone, companyEmail,
            companyDescription
        } = req.body;

        // Basic validation (Frontend ควรจะทำด้วย แต่ Backend ต้อง validate ซ้ำเพื่อความปลอดภัย)
        if (!username || !password || !email || !fullName || !companyName || !empProvince || !empDistrict || !empSubdistrict || !empZipCode) {
            return res.status(400).json({ message: "ข้อมูลสำคัญไม่ครบถ้วนสำหรับการสมัคร" });
        }

        // 1. Hash รหัสผ่าน
        const hashedPassword = await bcrypt.hash(password, 12);

        // 2. สร้างบริษัทใหม่
        const companyPayload = { // Map frontend formData to backend model fields
            company_name: companyName,
            company_address_number: companyAddressNo,
            company_moo: companyMoo,
            company_building: companyBuilding,
            company_street: companyStreet,
            company_soi: companySoi,
            company_subdistrict: companySubdistrict,
            company_district: companyDistrict,
            company_province: companyProvince,
            company_zip_code: companyZipCode,
            company_phone: companyPhone,
            company_email: companyEmail,
            company_description: companyDescription
        };
        const newCompany = await CompanyModel.createCompany(companyPayload); // company_status defaults to 'pending' in Model

        if (!newCompany || !newCompany.company_id) {
            throw new Error("ไม่สามารถสร้างข้อมูลบริษัทได้");
        }

        // 3. สร้างพนักงาน (Admin) คนแรก
        const emp_address_string = [
            empAddressNo,
            empMoo ? `หมู่ ${empMoo}` : '',
            empBuilding,
            empStreet,
            empSoi,
            empSubdistrict,
            empDistrict,
            empProvince,
            empZipCode
        ].filter(Boolean).join(' ');

        const employeePayload = { // This payload contains all employee specific data
            // ลบ company_id ออกจาก payload นี้ เพราะจะส่งเป็น argument ตัวที่สอง
            emp_username: username,
            emp_password: hashedPassword, // Hashed password
            emp_email: email,
            emp_name: fullName,
            emp_tel: phone,
            emp_address: emp_address_string,
            jobpos_id: 1, // Assumed jobpos_id for Admin/President
            emp_status: 'active' // Initial employee status
        };
        // แก้ไข: ส่ง newCompany.company_id เป็น Argument ตัวที่สอง
        const newEmployee = await EmployeeModel.create(employeePayload, newCompany.company_id); // <--- แก้ไขตรงนี้

        if (!newEmployee || !newEmployee.emp_id) {
            // หากสร้างพนักงานไม่สำเร็จ ให้พิจารณา Rollback โดยการลบข้อมูลบริษัทที่เพิ่งสร้างไป
            console.error(`Error creating employee, attempting to delete company ID: ${newCompany.company_id}`);
            await CompanyModel.deleteCompany(newCompany.company_id); // Rollback company creation
            throw new Error("ไม่สามารถสร้างข้อมูลพนักงานแอดมินได้");
        }

        // Success response
        res.status(201).json({
            message: 'สมัครบัญชีแอดมินและบริษัทสำเร็จ โปรดรอการอนุมัติจากผู้ดูแลระบบ',
            companyId: newCompany.company_id,
            employeeId: newEmployee.emp_id
        });

    } catch (err) {
        console.error("API Error [publicRegisterCompanyAndAdmin]:", err);
        // Handle specific duplicate entry errors from database
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
            if (err.sqlMessage && err.sqlMessage.includes('company_name')) {
                return res.status(409).json({ message: "ชื่อบริษัทนี้มีอยู่ในระบบแล้ว" });
            } else if (err.sqlMessage && (err.sqlMessage.includes('emp_username') || err.sqlMessage.includes('emp_email'))) {
                return res.status(409).json({ message: "ชื่อผู้ใช้ (Username) หรืออีเมลนี้มีอยู่ในระบบแล้ว" });
            }
        }
        res.status(500).json({ message: err.message || "เกิดข้อผิดพลาดในการสมัคร กรุณาลองอีกครั้ง" });
    }
});

module.exports = router;