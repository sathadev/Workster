// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'คุณไม่มีสิทธิ์เข้าถึง: ไม่พบ Token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // ดึงข้อมูลผู้ใช้จาก DB รวมถึง company_id
        const userResults = await query('SELECT emp_id, emp_name, jobpos_id, emp_email, company_id FROM employee WHERE emp_id = ?', [decoded.id]);

        if (userResults.length === 0) {
            return res.status(401).json({ message: 'ผู้ใช้งานของ Token นี้ไม่พบในระบบ' });
        }

        req.user = userResults[0]; // แนบข้อมูลผู้ใช้ทั้งหมด รวมถึง company_id
        req.companyId = req.user.company_id; // <-- สำคัญ: ดึง company_id มาเก็บใน req.companyId ให้เรียกใช้ง่ายๆ

        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token หมดอายุแล้ว โปรดเข้าสู่ระบบใหม่' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token ไม่ถูกต้อง โปรดเข้าสู่ระบบใหม่' });
        }
        console.error('JWT Verification Error:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
    }
};