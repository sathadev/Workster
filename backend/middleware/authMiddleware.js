// backend/middleware/authMiddleware.js (แบบที่ถูกต้อง)
const jwt = require('jsonwebtoken');
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // --- ส่วนที่แก้ไข ---
            // เปลี่ยน Query ให้ดึงข้อมูลทั้งหมด หรือฟิลด์ที่จำเป็นทั้งหมด
            const results = await query('SELECT * FROM employee WHERE emp_id = ?', [decoded.id]);
            
            if (results.length === 0) {
                 return res.status(401).json({ message: 'ไม่พบผู้ใช้ที่ผูกกับ Token นี้' });
            }
            
            // กรองรหัสผ่านทิ้งเพื่อความปลอดภัย
            const { emp_password, ...safeUser } = results[0];

            // แนบข้อมูล user ที่สมบูรณ์ (มี jobpos_id แล้ว) ไปกับ request
            req.user = safeUser;
            next();

        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = { protect };