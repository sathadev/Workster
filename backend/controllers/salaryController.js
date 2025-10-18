// backend/controllers/salaryController.js
// Controller สำหรับจัดการข้อมูลเงินเดือน (Salary)

const SalaryModel = require('../models/salaryModel');

// [GET] /api/v1/salaries/me 
// (User) ดูข้อมูลเงินเดือนของตนเอง
exports.getMySalary = async (req, res) => {
    try {
        const { emp_id, company_id } = req.user; // company_id มาจาก Middleware protect
        const salaryDetails = await SalaryModel.getSalaryByEmpId(emp_id, company_id);

        if (!salaryDetails) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของคุณ' });
        }

        res.status(200).json(salaryDetails);
    } catch (err) {
        console.error("API Error [getMySalary]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือนของคุณ" });
    }
};

// [GET] /api/v1/salaries 
// (Admin) ดึงข้อมูลเงินเดือนทั้งหมดของพนักงานในบริษัท
exports.getAllSalaries = async (req, res) => {
    try {
        const companyId = req.companyId; // มาจาก Middleware protect
        const result = await SalaryModel.getAll(req.query, companyId);
        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getAllSalaries]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือนทั้งหมด" });
    }
};

// [GET] /api/v1/salaries/:empId 
// (Admin) ดึงข้อมูลเงินเดือนของพนักงานรายบุคคล
exports.getSalaryByEmpId = async (req, res) => {
    try {
        const { empId } = req.params;
        const companyId = req.companyId;
        const salaryDetails = await SalaryModel.getSalaryByEmpId(empId, companyId);

        if (!salaryDetails) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของพนักงานนี้' });
        }

        res.status(200).json(salaryDetails);
    } catch (err) {
        console.error("API Error [getSalaryByEmpId]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือนของพนักงาน" });
    }
};

// [PUT] /api/v1/salaries/:empId 
// (Admin) อัปเดตข้อมูลเงินเดือนของพนักงาน
exports.updateSalary = async (req, res) => {
    try {
        const { empId } = req.params;
        const salaryData = req.body;
        const companyId = req.companyId;

        const finalDetails = await SalaryModel.updateSalary(empId, salaryData, companyId);
        res.status(200).json(finalDetails);
    } catch (err) {
        console.error("API Error [updateSalary]:", err);
        res.status(500).json({ message: "อัปเดตข้อมูลเงินเดือนไม่สำเร็จ" });
    }
};
