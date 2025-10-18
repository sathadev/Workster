// backend/middleware/authMiddleware.js
// ใช้สำหรับตรวจสอบสิทธิ์ (Authentication) ของผู้ใช้ก่อนเข้าถึง API

const jwt = require('jsonwebtoken');
const query = require('../utils/db');

exports.protect = async (req, res, next) => {
  try {
    // ตรวจสอบว่ามี Authorization header และขึ้นต้นด้วย 'Bearer' หรือไม่
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'คุณไม่มีสิทธิ์เข้าถึง: ไม่พบ Token' });
    }

    // แยก token ออกจาก header
    const token = authHeader.split(' ')[1];

    // ตรวจสอบและถอดรหัส Token ด้วย Secret Key จาก .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ดึงข้อมูลผู้ใช้จากฐานข้อมูล (ตาม emp_id ที่อยู่ใน Token)
    const [user] = await query(
      'SELECT emp_id, emp_name, jobpos_id, emp_email, company_id FROM employee WHERE emp_id = ?',
      [decoded.id]
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: 'ผู้ใช้งานของ Token นี้ไม่พบในระบบ' });
    }

    // เพิ่มข้อมูลผู้ใช้ใน req.user เพื่อส่งต่อให้ controller อื่นใช้งานได้
    req.user = user;

    // ตรวจสอบสิทธิ์ Super Admin (jobpos_id = 0 และไม่มี company_id)
    req.user.isSuperAdmin =
      req.user.jobpos_id === 0 && req.user.company_id === null;

    // กำหนด companyId สำหรับใช้กรองข้อมูลในแต่ละบริษัท
    req.companyId = req.user.isSuperAdmin ? null : req.user.company_id;

    // ถ้ามี company_id ให้ดึงสถานะบริษัท (เช่น active / pending / rejected)
    if (req.user.company_id) {
      const [company] = await query(
        'SELECT company_status FROM companies WHERE company_id = ?',
        [req.user.company_id]
      );
      req.user.company_status = company?.company_status || null;
    }

    // ผ่านการตรวจสอบทั้งหมด → ส่งต่อให้ controller ถัดไป
    next();
  } catch (err) {
    //  จัดการ Error ที่เกี่ยวข้องกับ Token
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json({ message: 'Token หมดอายุแล้ว โปรดเข้าสู่ระบบใหม่' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res
        .status(401)
        .json({ message: 'Token ไม่ถูกต้อง โปรดเข้าสู่ระบบใหม่' });
    }

    // จัดการ Error อื่น ๆ
    console.error('JWT Verification Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
};
