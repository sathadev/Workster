// backend/controllers/jobposController.js
const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel');

// [GET] /api/v1/positions
exports.getAllPositions = async (req, res) => {
  try {
    const positions = await Jobpos.getAll(req.companyId);
    res.status(200).json(positions);
  } catch (err) {
    console.error("API Error [getAllPositions]:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน" });
  }
};

// [GET] /api/v1/positions/:id
exports.getPositionById = async (req, res) => {
  try {
    const { id } = req.params;
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
    res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียด" });
  }
};

// [POST] /api/v1/positions
exports.createPosition = async (req, res) => {
  try {
    const { jobpos_name } = req.body;
    const targetCompanyIdForJobpos = req.companyId;

    if (!jobpos_name || !jobpos_name.trim()) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อตำแหน่งงาน' });
    }

    const newPosition = await Jobpos.create(jobpos_name.trim(), targetCompanyIdForJobpos);
    res.status(201).json(newPosition);
  } catch (err) {
    console.error("API Error [createPosition]:", err);
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

    const updatedPosition = await Jobpos.update(id, jobpos_name.trim(), req.companyId);
    if (!updatedPosition) {
      return res.status(404).json({ message: 'ไม่พบตำแหน่งงานที่จะอัปเดต' });
    }
    res.status(200).json(updatedPosition);
  } catch (err) {
    console.error("API Error [updatePosition]:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการอัปเดตตำแหน่งงาน" });
  }
};

// [DELETE] /api/v1/positions/:id
exports.deletePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Jobpos.delete(id, req.companyId);
    if (!deleted) {
      const error = new Error('ไม่พบตำแหน่งงานที่จะลบ หรือคุณไม่มีสิทธิ์ลบ');
      error.statusCode = 404;
      throw error;
    }
    res.status(204).send();
  } catch (err) {
    console.error("API Error [deletePosition]:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการลบตำแหน่งงาน" });
  }
};

// --- Public Endpoint: ดึง Global positions (company_id IS NULL) ---
/**
 * @route GET /api/v1/positions/public
 * @access Public
 */
exports.getPublicPositions = async (_req, res) => {
  try {
    const positions = await Jobpos.getAll(null); // null => Global only
    res.status(200).json(positions.filter(pos => pos.jobpos_id !== 0));
  } catch (err) {
    console.error("API Error [getPublicPositions]:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงานสาธารณะ" });
  }
};
