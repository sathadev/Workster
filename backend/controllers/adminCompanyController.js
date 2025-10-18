// backend/controllers/adminCompanyController.js
// Controller สำหรับจัดการข้อมูลบริษัท (เฉพาะ Super Admin)

const CompanyModel = require('../models/companyModel');

// [GET] /api/v1/admin/companies
// ดึงข้อมูลบริษัททั้งหมด (พร้อม Search, Filter, Pagination) สำหรับ Super Admin
exports.getAllCompaniesForAdmin = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ Super Admin ก่อนเข้าถึงข้อมูล
    if (!req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
    }

    // ดึงข้อมูลบริษัททั้งหมดจาก Model
    const result = await CompanyModel.getAllCompanies(req.query);
    res.status(200).json(result);
  } catch (err) {
    console.error('API Error [getAllCompaniesForAdmin]:', err);
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท' });
  }
};

// [GET] /api/v1/admin/companies/:id
// ดึงข้อมูลบริษัทเฉพาะ id (เฉพาะ Super Admin)
exports.getCompanyByIdForAdmin = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ก่อน
    if (!req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
    }

    // ดึง id จากพารามิเตอร์ URL
    const { id } = req.params;

    // ค้นหาข้อมูลบริษัทจากฐานข้อมูล
    const company = await CompanyModel.getCompanyById(id);

    // หากไม่พบข้อมูลบริษัท
    if (!company) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลบริษัทนี้' });
    }

    // ส่งข้อมูลบริษัทกลับ
    res.status(200).json(company);
  } catch (err) {
    console.error('API Error [getCompanyByIdForAdmin]:', err);
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท' });
  }
};

// [PATCH] /api/v1/admin/companies/:id/status
// อัปเดตสถานะบริษัท (approved / rejected) สำหรับ Super Admin เท่านั้น
exports.updateCompanyStatus = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ก่อนเข้าถึง
    if (!req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
    }

    // ดึง id บริษัทจาก URL และสถานะจาก body
    const { id } = req.params;
    const { status } = req.body;

    // ตรวจสอบความถูกต้องของสถานะ
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'สถานะไม่ถูกต้อง: ต้องเป็น "approved" หรือ "rejected"',
      });
    }

    // เรียก Model เพื่ออัปเดตสถานะบริษัท
    const updatedCompany = await CompanyModel.updateCompanyStatus(id, status);

    // หากไม่พบข้อมูลบริษัทในระบบ
    if (!updatedCompany) {
      return res
        .status(404)
        .json({ message: 'ไม่พบข้อมูลบริษัท หรือไม่สามารถอัปเดตได้' });
    }

    // ส่งข้อความยืนยันและข้อมูลบริษัทกลับ
    res.status(200).json({
      message: `อัปเดตสถานะบริษัท ${updatedCompany.company_name} เป็น ${updatedCompany.company_status} สำเร็จ`,
      company: updatedCompany,
    });
  } catch (err) {
    console.error('API Error [updateCompanyStatus]:', err);
    res.status(500).json({
      message: err.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะบริษัท',
    });
  }
};

// [DELETE] /api/v1/admin/companies/:id
// ลบข้อมูลบริษัทออกจากระบบ (เฉพาะ Super Admin)
exports.deleteCompanyByAdmin = async (req, res) => {
  try {
    // ตรวจสอบสิทธิ์ก่อน
    if (!req.user.isSuperAdmin) {
      return res
        .status(403)
        .json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
    }

    // ดึง id จาก URL
    const { id } = req.params;

    // ลบข้อมูลบริษัทออกจากฐานข้อมูล
    const deleted = await CompanyModel.deleteCompany(id);

    // หากไม่พบข้อมูลบริษัท
    if (!deleted) {
      return res
        .status(404)
        .json({ message: 'ไม่พบข้อมูลบริษัทที่ต้องการลบ' });
    }

    // ลบสำเร็จ -> ส่งสถานะ 204 (No Content)
    res.status(204).send();
  } catch (err) {
    console.error('API Error [deleteCompanyByAdmin]:', err);
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูลบริษัท' });
  }
};
