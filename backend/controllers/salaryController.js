// backend/controllers/salaryController.js
// ลบ util และ db ที่ไม่จำเป็นออก
// const util = require('util');
// const db = require('../config/db');
const SalaryModel = require('../models/salaryModel');

// const query = util.promisify(db.query).bind(db); // ไม่จำเป็นต้องประกาศที่นี่แล้ว

// Helper Function อัจฉริยะสำหรับคำนวณเงินเดือน -> ลบออกไปได้เลย

// [GET] /api/v1/salaries/me - ดูข้อมูลเงินเดือนของตนเอง
exports.getMySalary = async (req, res) => {
    const { emp_id, company_id } = req.user; // company_id มาจาก Middleware protect แล้ว

    // เรียกใช้ Model โดยตรงที่คำนวณข้อมูลให้เรียบร้อยแล้ว
    const salaryDetails = await SalaryModel.getSalaryByEmpId(emp_id, company_id);

    if (!salaryDetails) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของคุณ' });
    }
    res.status(200).json(salaryDetails);
};

// [GET] /api/v1/salaries - ดึงข้อมูลเงินเดือนทั้งหมด (สำหรับ Admin)
exports.getAllSalaries = async (req, res) => {
    try {
        const companyId = req.companyId; // มาจาก Middleware protect

        // เรียกใช้ Model โดยตรงที่คำนวณข้อมูลให้เรียบร้อยแล้ว
        const result = await SalaryModel.getAll(req.query, companyId);

        // ไม่ต้อง map หรือ calculate เพิ่มเติมแล้ว
        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getAllSalaries]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน" });
    }
};

// [GET] /api/v1/salaries/:empId
exports.getSalaryByEmpId = async (req, res) => {
    const { empId } = req.params;
    const companyId = req.companyId; // มาจาก Middleware protect

    // เรียกใช้ Model โดยตรงที่คำนวณข้อมูลให้เรียบร้อยแล้ว
    const salaryDetails = await SalaryModel.getSalaryByEmpId(empId, companyId);

    if (!salaryDetails) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของพนักงานนี้' });
    }
    res.status(200).json(salaryDetails);
};

// [PUT] /api/v1/salaries/:empId - อัปเดตข้อมูลเงินเดือน (สำหรับ Admin)
exports.updateSalary = async (req, res) => {
    try {
        const { empId } = req.params;
        const salaryData = req.body;
        const companyId = req.companyId;

        // Model จะจัดการการ update และ return ข้อมูลที่คำนวณแล้วกลับมาเลย
        const finalDetails = await SalaryModel.updateSalary(empId, salaryData, companyId);

        res.status(200).json(finalDetails);
    } catch (err) {
        console.error("API Error [updateSalary]:", err); // เพิ่ม log error
        res.status(500).json({ message: "อัปเดตข้อมูลเงินเดือนไม่สำเร็จ" });
    }
};