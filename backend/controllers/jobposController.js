// backend/controllers/jobposController.js
const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel'); // ยังคงต้องใช้เพื่อดึงพนักงาน

// [GET] /api/v1/positions
exports.getAllPositions = async (req, res) => {
  try {
    const positions = await Jobpos.getAll();
    res.status(200).json(positions);
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน" });
  }
};

// [GET] /api/v1/positions/:id
exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
    const [position, employeesInPos] = await Promise.all([
        Jobpos.getById(id),
        Employee.getByJobposId(id)
    ]);

    if (!position) {
      return res.status(404).json({ message: 'ไม่พบตำแหน่งงานนี้' });
    }
    
    // ส่งข้อมูลตำแหน่ง พร้อมกับรายชื่อพนักงานในตำแหน่งนั้นๆ กลับไป
    res.status(200).json({ position, employees: employeesInPos });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียด" });
  }
};

// [POST] /api/v1/positions
exports.createPosition = async (req, res) => {
  try {
    const { jobpos_name } = req.body;
    if (!jobpos_name || !jobpos_name.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อตำแหน่งงาน' });
    }
    const newPosition = await Jobpos.create(jobpos_name.trim());
    res.status(201).json(newPosition);
  } catch (err) {
    // จัดการ Error ที่มาจาก Model (เช่น ชื่อซ้ำ)
    res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน" });
  }
};

// [PUT] /api/v1/positions/:id
exports.updatePosition = async (req, res) => {
    try {
        const { id } = req.params;
        const { jobpos_name } = req.body;
        if (!jobpos_name || !jobpos_name.trim()) {
            return res.status(400).json({ message: 'กรุณาระบุชื่อตำแหน่งงาน' });
        }
        const updatedPosition = await Jobpos.update(id, jobpos_name.trim());
        if (!updatedPosition) {
            return res.status(404).json({ message: 'ไม่พบตำแหน่งงานที่จะอัปเดต' });
        }
        res.status(200).json(updatedPosition);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตตำแหน่งงาน" });
    }
};

// [DELETE] /api/v1/positions/:id
exports.deletePosition = async (req, res) => {
    try {
        const { id } = req.params;
        await Jobpos.delete(id);
        // สำหรับ DELETE ส่งแค่สถานะสำเร็จกลับไปก็เพียงพอ
        res.status(204).send(); 
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบตำแหน่งงาน" });
    }
};