// backend/controllers/adminCompanyController.js
const CompanyModel = require('../models/companyModel');

/**
 * @desc ดึงข้อมูลบริษัททั้งหมดสำหรับ Admin (พร้อม Search, Filter, Pagination)
 * @route GET /api/v1/admin/companies
 * @access SuperAdmin (jobpos_id = 1)
 */
exports.getAllCompaniesForAdmin = async (req, res) => {
    try {
        // ตรวจสอบบทบาท: เฉพาะ Super Admin (jobpos_id = 1) เท่านั้นที่เข้าถึงได้
        if (!req.user.isSuperAdmin) { // ใช้ isSuperAdmin ที่ถูกตั้งค่าใน middleware
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
        }

        const result = await CompanyModel.getAllCompanies(req.query);
        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getAllCompaniesForAdmin]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" });
    }
};

/**
 * @desc ดึงข้อมูลบริษัทเดียวด้วย id (สำหรับ Super Admin)
 * @route GET /api/v1/admin/companies/:id
 * @access SuperAdmin
 */
exports.getCompanyByIdForAdmin = async (req, res) => {
    try {
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
        }
        const { id } = req.params;
        const company = await CompanyModel.getCompanyById(id);
        if (!company) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลบริษัทนี้' });
        }
        res.status(200).json(company);
    } catch (err) {
        console.error('API Error [getCompanyByIdForAdmin]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท' });
    }
};

/**
 * @desc อัปเดตสถานะของบริษัท (อนุมัติ/ปฏิเสธ)
 * @route PATCH /api/v1/admin/companies/:id/status
 * @access SuperAdmin (jobpos_id = 1)
 */
exports.updateCompanyStatus = async (req, res) => {
    try {
        // ตรวจสอบบทบาท: เฉพาะ Super Admin (jobpos_id = 1) เท่านั้นที่เข้าถึงได้
        if (!req.user.isSuperAdmin) { // ใช้ isSuperAdmin ที่ถูกตั้งค่าใน middleware
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'สถานะไม่ถูกต้อง: ต้องเป็น "approved" หรือ "rejected"' });
        }

        const updatedCompany = await CompanyModel.updateCompanyStatus(id, status);

        if (!updatedCompany) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลบริษัท หรือไม่สามารถอัปเดตได้' });
        }
        res.status(200).json({ message: `อัปเดตสถานะบริษัท ${updatedCompany.company_name} เป็น ${updatedCompany.company_status} สำเร็จ`, company: updatedCompany });

    } catch (err) {
        console.error("API Error [updateCompanyStatus]:", err);
        res.status(500).json({ message: err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะบริษัท' });
    }
};

/**
 * @desc ลบข้อมูลบริษัท (เฉพาะ Admin)
 * @route DELETE /api/v1/admin/companies/:id
 * @access SuperAdmin (jobpos_id = 1)
 */
exports.deleteCompanyByAdmin = async (req, res) => {
    try {
        if (!req.user.isSuperAdmin) { // ใช้ isSuperAdmin ที่ถูกตั้งค่าใน middleware
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
        }

        const { id } = req.params;
        const deleted = await CompanyModel.deleteCompany(id);

        if (!deleted) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลบริษัทที่ต้องการลบ' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("API Error [deleteCompanyByAdmin]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูลบริษัท" });
    }
};