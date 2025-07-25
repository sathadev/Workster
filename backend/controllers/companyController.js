// backend/controllers/companyController.js
const CompanyModel = require('../models/companyModel'); // ตรวจสอบให้แน่ใจว่าเส้นทางนี้ถูกต้อง

/**
 * @desc    ดึงข้อมูลบริษัททั้งหมด
 * @route   GET /api/v1/companies
 * @access  Admin
 */
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await CompanyModel.getAllCompanies();
        res.status(200).json(companies);
    } catch (err) {
        console.error("API Error [getAllCompanies]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" });
    }
};

/**
 * @desc    ดึงข้อมูลบริษัทเดียว
 * @route   GET /api/v1/companies/:id
 * @access  Admin
 */
exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        const company = await CompanyModel.getCompanyById(id);
        if (!company) {
            return res.status(404).json({ message: "ไม่พบข้อมูลบริษัท" });
        }
        res.status(200).json(company);
    } catch (err) {
        console.error("API Error [getCompanyById]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" });
    }
};

/**
 * @desc    สร้างบริษัทใหม่
 * @route   POST /api/v1/companies
 * @access  Admin
 */
exports.createCompany = async (req, res) => {
    try {
        // สามารถเพิ่มการตรวจสอบข้อมูล (validation) ได้ที่นี่
        const newCompany = await CompanyModel.createCompany(req.body);
        res.status(201).json(newCompany);
    } catch (err) {
        console.error("API Error [createCompany]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างบริษัท" });
    }
};

/**
 * @desc    อัปเดตข้อมูลบริษัท
 * @route   PUT /api/v1/companies/:id
 * @access  Admin
 */
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        // สามารถเพิ่มการตรวจสอบข้อมูล (validation) ได้ที่นี่
        const updatedCompany = await CompanyModel.updateCompany(id, req.body);
        if (!updatedCompany) {
            return res.status(404).json({ message: "ไม่พบข้อมูลบริษัท" });
        }
        res.status(200).json(updatedCompany);
    } catch (err) {
        console.error("API Error [updateCompany]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลบริษัท" });
    }
};

/**
 * @desc    ลบข้อมูลบริษัท
 * @route   DELETE /api/v1/companies/:id
 * @access  Admin
 */
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CompanyModel.deleteCompany(id);
        if (!deleted) {
            return res.status(404).json({ message: "ไม่พบข้อมูลบริษัทที่ต้องการลบ" });
        }
        res.status(204).send(); // 204 No Content สำหรับการลบสำเร็จ
    } catch (err) {
        console.error("API Error [deleteCompany]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูลบริษัท" });
    }
};