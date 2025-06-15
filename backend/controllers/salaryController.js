// backend/controllers/salaryController.js
const SalaryModel = require('../models/salaryModel');

// [GET] /api/v1/salaries - ดึงข้อมูลเงินเดือนทั้งหมด (สำหรับ Admin)
exports.getAllSalaries = async (req, res) => {
    const { search = '', page = 1, limit = 10 } = req.query;
    try {
        let result;
        if (search.trim()) {
            result = await SalaryModel.searchSalaryInfo(search.trim(), page, limit);
        } else {
            result = await SalaryModel.getAllSalaryInfo(page, limit);
        }
        res.status(200).json(result);
    } catch (err) {
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
exports.getMySalary = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }
    try {
        const { emp_id } = req.session.user;
        const salaryInfo = await SalaryModel.getSalaryByEmpId(emp_id);

        if (!salaryInfo) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของคุณ' });
        }
        res.status(200).json(salaryInfo);
    } catch (err) {
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    }
};