// backend/middleware/requireCompanyAuth.js
// ใช้ตรวจสอบสิทธิ์ (Authorization) ว่าผู้ใช้มี company_id ที่ถูกต้องก่อนเข้าถึง API

module.exports = function requireCompanyAuth(req, res, next) {
  try {
    // ดึงค่า company_id จาก req.user (หลังผ่าน authMiddleware)
    // หรือถ้าไม่มี ให้ลองอ่านจาก Header: X-Company-Id
    const rawCompanyId = req.user?.company_id ?? req.headers['x-company-id'];

    // แปลงค่าให้เป็นตัวเลข (เพื่อป้องกัน input ที่เป็น string หรือ null)
    const companyId = Number(rawCompanyId);

    // ตรวจสอบความถูกต้องของค่า company_id
    if (!rawCompanyId || Number.isNaN(companyId) || companyId <= 0) {
      return res.status(401).json({
        message: 'ต้องมี company_id (ผ่าน JWT หรือ X-Company-Id header)',
      });
    }

    // ถ้าผ่านการตรวจสอบแล้ว ให้บันทึกค่าไว้ใน req.companyId
    req.companyId = companyId;

    // ส่งต่อไปยัง Controller ถัดไป
    next();
  } catch (error) {
    console.error('requireCompanyAuth Error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
