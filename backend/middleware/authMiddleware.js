// backend/middleware/authMiddleware.js

const protect = (req, res, next) => {
    // ตรวจสอบว่าใน session มีข้อมูล user เก็บอยู่หรือไม่
    if (req.session && req.session.user) {
        // ถ้ามี แสดงว่าผู้ใช้ล็อกอินอยู่ และ session ยังไม่หมดอายุ
        // อนุญาตให้ request ดำเนินการต่อไปยัง route handler ตัวถัดไป
        next();
    } else {
        // ถ้าไม่มีข้อมูล user ใน session แสดงว่ายังไม่ได้ล็อกอิน หรือ session หมดอายุแล้ว
        // ไม่อนุญาตให้เข้าถึง และส่งสถานะ 401 Unauthorized กลับไป
        res.status(401).json({ message: 'Not authorized, please login' });
    }
};

module.exports = { protect };