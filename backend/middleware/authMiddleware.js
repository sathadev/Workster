// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const query = require('../utils/db');

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

        const userResults = await query('SELECT emp_id, emp_name, jobpos_id, emp_email, company_id FROM employee WHERE emp_id = ?', [decoded.id]);

        if (userResults.length === 0) {
            return res.status(401).json({ message: 'ผู้ใช้งานของ Token นี้ไม่พบในระบบ' });
        }

        req.user = userResults[0];

        // *** Logic Super Admin (jobpos_id = 0, company_id = NULL) ***
        req.user.isSuperAdmin = (req.user.jobpos_id === 0 && req.user.company_id === null);
        
        if (req.user.isSuperAdmin) {
            req.companyId = null; // Super Admin ไม่มี company_id ที่จะใช้กรองข้อมูล
        } else {
            req.companyId = req.user.company_id; // สำหรับผู้ใช้ปกติ/HR/Admin
        }
        // ************************************************************

        // ดึง company_status ถ้ามี company_id
        if (req.user.company_id) {
            const [company] = await query('SELECT company_status FROM companies WHERE company_id = ?', [req.user.company_id]);
            req.user.company_status = company ? company.company_status : null;
        }

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