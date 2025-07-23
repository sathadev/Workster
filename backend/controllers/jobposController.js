// backend/controllers/jobposController.js
const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel'); // ยังคงต้องใช้เพื่อดึงพนักงาน

// [GET] /api/v1/positions
exports.getAllPositions = async (req, res) => {
    try {
        // ส่ง companyId เพื่อให้ Model ดึงทั้ง Global และ Tenant-Specific
        const positions = await Jobpos.getAll(req.companyId);
        res.status(200).json(positions);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน" });
    }
};

// [GET] /api/v1/positions/:id
exports.getPositionById = async (req, res) => {
    try {
        const { id } = req.params;
        // ดึงตำแหน่งงานโดยใช้ ID และ companyId (เพื่อให้แน่ใจว่าเป็นตำแหน่งที่ผู้ใช้เข้าถึงได้)
        const [position, employeesInPos] = await Promise.all([
            Jobpos.getById(id, req.companyId), // <--- ส่ง req.companyId
            Employee.getByJobposId(id, req.companyId) // <--- ส่ง req.companyId (employees จะถูกกรองด้วย companyId ใน employeeModel อยู่แล้ว)
        ]);

        if (!position) {
            return res.status(404).json({ message: 'ไม่พบตำแหน่งงานนี้' });
        }
        
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
        // สร้างตำแหน่งงานใหม่ และผูกกับ companyId ของผู้ใช้ที่สร้าง
        const newPosition = await Jobpos.create(jobpos_name.trim(), req.companyId);
        res.status(201).json(newPosition);
    } catch (err) {
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
        // อัปเดตตำแหน่งงาน และต้องเป็นของบริษัทที่ล็อกอินอยู่เท่านั้น
        const updatedPosition = await Jobpos.update(id, jobpos_name.trim(), req.companyId);
        if (!updatedPosition) {
            return res.status(404).json({ message: 'ไม่พบตำแหน่งงานที่จะอัปเดต' });
        }
        res.status(200).json(updatedPosition);
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการอัปเดตตำแหน่งงาน" });
    }
};

// [DELETE] /api/v1/positions/:id
exports.deletePosition = async (req, res) => {
    try {
        const { id } = req.params;
        // ลบตำแหน่งงาน และต้องเป็นของบริษัทที่ล็อกอินอยู่เท่านั้น
        await Jobpos.delete(id, req.companyId);
        res.status(204).send(); // 204 No Content for successful deletion
    } catch (err) {
        res.status(err.statusCode || 500).json({ message: err.message || "เกิดข้อผิดพลาดในการลบตำแหน่งงาน" });
    }
};