// backend/controllers/jobposController.js
const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel');

// [GET] /api/v1/positions
exports.getAllPositions = async (req, res) => {
    try {
        // ส่ง req.companyId ไปยัง Model
        const positions = await Jobpos.getAll(req.companyId); // <-- ลบ req.user.isSuperAdmin ออก
        res.status(200).json(positions);
    } catch (err) {
        console.error("API Error [getAllPositions]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน" });
    }
};

// [GET] /api/v1/positions/:id
exports.getPositionById = async (req, res) => {
    try {
        const { id } = req.params;
        // ส่ง req.companyId ไปยัง Model
        const [position, employeesInPos] = await Promise.all([
            Jobpos.getById(id, req.companyId), // <-- ลบ req.user.isSuperAdmin ออก
            Employee.getByJobposId(id, req.companyId) // EmployeeModel ไม่ต้องสนใจ isSuperAdmin
        ]);

        if (!position) {
            return res.status(404).json({ message: 'ไม่พบตำแหน่งงานนี้' });
        }
        
        res.status(200).json({ position, employees: employeesInPos });
    } catch (err) {
        console.error("API Error [getPositionById]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียด" });
    }
};

// [POST] /api/v1/positions
exports.createPosition = async (req, res) => {
    try {
        const { jobpos_name } = req.body;
        // ลบ Logic ที่เกี่ยวข้องกับ Super Admin ในการสร้าง Global jobpos ออก
        // ตอนนี้ Admin/HR ปกติสร้าง jobpos ที่มี company_id เป็นของตัวเอง
        const targetCompanyIdForJobpos = req.companyId; // <-- ใช้ req.companyId โดยตรง

        if (!jobpos_name || !jobpos_name.trim()) {
            return res.status(400).json({ message: 'กรุณาระบุชื่อตำแหน่งงาน' });
        }
        // สร้างตำแหน่งงานใหม่ และผูกกับ companyId ของผู้ใช้ที่สร้าง
        const newPosition = await Jobpos.create(jobpos_name.trim(), targetCompanyIdForJobpos); // <-- ลบ isSuperAdmin ออก
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
        // อัปเดตตำแหน่งงาน และต้องเป็นของบริษัทที่ล็อกอินอยู่เท่านั้น
        const updatedPosition = await Jobpos.update(id, jobpos_name.trim(), req.companyId); // <-- ลบ isSuperAdmin ออก
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
        // ลบตำแหน่งงาน และต้องเป็นของบริษัทที่ล็อกอินอยู่เท่านั้น
        const deleted = await Jobpos.delete(id, req.companyId); // <-- ลบ isSuperAdmin ออก
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