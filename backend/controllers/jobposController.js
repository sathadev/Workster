// backend/controllers/jobposController.js
// Controller สำหรับจัดการข้อมูล "ตำแหน่งงาน (Job Positions)"
// เชื่อมต่อกับ Model: jobposModel และ employeeModel
// ครอบคลุมการทำงาน CRUD และการดึงตำแหน่งสาธารณะ (Public positions)

const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel');

// [GET] /api/v1/positions
// ดึงตำแหน่งงานทั้งหมดของบริษัทที่ล็อกอินอยู่
exports.getAllPositions = async (req, res) => {
  try {
    // companyId จะมาจาก JWT / middleware (ระบุบริษัทที่ล็อกอิน)
    const positions = await Jobpos.getAll(req.companyId);
    res.status(200).json(positions);
  } catch (err) {
    console.error("API Error [getAllPositions]:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน"
    });
  }
};

// [GET] /api/v1/positions/:id
// ดึงข้อมูลตำแหน่งงานตามรหัส (id)
// พร้อมพนักงานทั้งหมดที่อยู่ในตำแหน่งนั้น
exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;

    // ดึงข้อมูลตำแหน่งและรายชื่อพนักงานพร้อมกัน (ทำงานแบบขนาน)
    const [position, employeesInPos] = await Promise.all([
      Jobpos.getById(id, req.companyId),
      Employee.getByJobposId(id, req.companyId)
    ]);

    if (!position) {
      return res.status(404).json({ message: 'ไม่พบตำแหน่งงานนี้' });
    }

    res.status(200).json({ position, employees: employeesInPos });
  } catch (err) {
    console.error("API Error [getPositionById]:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียด"
    });
  }
};

// [POST] /api/v1/positions
// สร้างตำแหน่งงานใหม่ในบริษัท
exports.createPosition = async (req, res) => {
  try {
    const { jobpos_name } = req.body;
    const targetCompanyIdForJobpos = req.companyId; // บริษัทของผู้สร้างตำแหน่ง

    // ตรวจสอบว่ามีการระบุชื่อหรือไม่
    if (!jobpos_name || !jobpos_name.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อตำแหน่งงาน' });
    }

    // บันทึกตำแหน่งใหม่ลงฐานข้อมูล
    const newPosition = await Jobpos.create(jobpos_name.trim(), targetCompanyIdForJobpos);
    res.status(201).json(newPosition);
  } catch (err) {
    console.error("API Error [createPosition]:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน"
    });
  }
};

// [PUT] /api/v1/positions/:id
// อัปเดตข้อมูลตำแหน่งงาน
exports.updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { jobpos_name } = req.body;

    // ตรวจสอบชื่อใหม่ก่อนอัปเดต
    if (!jobpos_name || !jobpos_name.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อตำแหน่งงาน' });
    }

    // อัปเดตข้อมูลในฐานข้อมูล
    const updatedPosition = await Jobpos.update(id, jobpos_name.trim(), req.companyId);

    // ถ้าไม่พบ ID ให้แจ้ง 404
    if (!updatedPosition) {
      return res.status(404).json({ message: 'ไม่พบตำแหน่งงานที่จะอัปเดต' });
    }

    res.status(200).json(updatedPosition);
  } catch (err) {
    console.error("API Error [updatePosition]:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "เกิดข้อผิดพลาดในการอัปเดตตำแหน่งงาน"
    });
  }
};

// [DELETE] /api/v1/positions/:id
// ลบตำแหน่งงานออกจากระบบ
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Jobpos.delete(id, req.companyId);

    // ถ้าไม่มีสิทธิ์หรือไม่พบข้อมูล
    if (!deleted) {
      const error = new Error('ไม่พบตำแหน่งงานที่จะลบ หรือคุณไม่มีสิทธิ์ลบ');
      error.statusCode = 404;
      throw error;
    }

    // 204 = No Content (ลบสำเร็จ ไม่มีข้อมูลตอบกลับ)
    res.status(204).send();
  } catch (err) {
    console.error("API Error [deletePosition]:", err);
    res.status(err.statusCode || 500).json({
      message: err.message || "เกิดข้อผิดพลาดในการลบตำแหน่งงาน"
    });
  }
};

// [GET] /api/v1/positions/public
// Endpoint สาธารณะสำหรับดึงตำแหน่งงานกลาง (Global positions)
// เช่น "พนักงานทั่วไป", "ผู้จัดการ", "HR" ที่ไม่ผูกกับบริษัทใดบริษัทหนึ่ง
exports.getPublicPositions = async (_req, res) => {
  try {
    // companyId = null → ดึงตำแหน่งที่เป็น Global
    const positions = await Jobpos.getAll(null);

    // กันไม่ให้ตำแหน่ง id = 0 หลุดออกมา (เผื่อเป็น placeholder)
    res.status(200).json(positions.filter(pos => pos.jobpos_id !== 0));
  } catch (err) {
    console.error("API Error [getPublicPositions]:", err);
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงานสาธารณะ"
    });
  }
};
