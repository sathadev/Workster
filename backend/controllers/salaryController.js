// backend/controllers/salaryController.js
const SalaryModel = require('../models/salaryModel');

// [GET] /api/v1/salaries - ดึงข้อมูลเงินเดือนทั้งหมด (สำหรับ Admin)
exports.getAllSalaries = async (req, res) => {
    try {
        // ส่ง req.query ทั้งหมด (ที่มี search, sort, order, page, filter)
        // เข้าไปในฟังก์ชัน getAll ของ Model ได้เลย
        const result = await SalaryModel.getAll(req.query);
        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getAllSalaries]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน" });
    }
};
// [PUT] /api/v1/salaries/:empId - อัปเดตข้อมูลเงินเดือน (สำหรับ Admin)
exports.updateSalary = async (req, res) => {
    try {
        const { empId } = req.params;
        const salaryData = req.body;
        const updatedSalary = await SalaryModel.updateSalary(empId, salaryData);
        res.status(200).json(updatedSalary);
    } catch (err) {
        res.status(500).json({ message: "อัปเดตข้อมูลเงินเดือนไม่สำเร็จ" });
    }
};

// [GET] /api/v1/salaries/me - ดูข้อมูลเงินเดือนของตนเอง
// [GET] /api/v1/salaries/me - ดูข้อมูลเงินเดือนของตนเอง
exports.getMySalary = async (req, res) => {
    // ไม่ต้องมี if check แล้ว เพราะ protect middleware จัดการให้
    try {
        // เปลี่ยนมาใช้ req.user แทน
        const { emp_id } = req.user; 
        const salaryInfo = await SalaryModel.getSalaryByEmpId(emp_id);

        if (!salaryInfo) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของคุณ' });
        }
        res.status(200).json(salaryInfo);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};

// [GET] /api/v1/salaries/:empId
exports.getSalaryByEmpId = async (req, res) => {
    try {
        const { empId } = req.params;
        const salaryInfo = await SalaryModel.getSalaryByEmpId(empId);
        if (!salaryInfo) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของพนักงานนี้' });
        }
        res.status(200).json(salaryInfo);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};