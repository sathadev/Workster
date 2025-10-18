// backend/controllers/companyController.js
// Controller สำหรับจัดการข้อมูลบริษัท (Company)
// ใช้เชื่อมระหว่าง route กับ model เช่น ดึง, เพิ่ม, อัปเดต และลบข้อมูลบริษัท

const CompanyModel = require('../models/companyModel'); // นำเข้า Model สำหรับจัดการข้อมูลบริษัท

// [GET] /api/v1/companies
// ดึงข้อมูลบริษัททั้งหมด (ใช้ในหน้าแสดงรายการบริษัท)
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await CompanyModel.getAllCompanies(); // เรียก model เพื่อดึงข้อมูล
        res.status(200).json(companies); // ส่งผลลัพธ์กลับเป็น JSON
    } catch (err) {
        console.error("API Error [getAllCompanies]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" });
    }
};

// [GET] /api/v1/companies/:id
// ดึงข้อมูลบริษัทตาม company_id
exports.getCompanyById = async (req, res) => {
    try {
        const { id } = req.params; // รับค่า id จาก URL
        const company = await CompanyModel.getCompanyById(id); // ดึงข้อมูลบริษัทจาก model

        if (!company) {
            // ถ้าไม่พบบริษัทที่ระบุ
            return res.status(404).json({ message: "ไม่พบข้อมูลบริษัท" });
        }

        res.status(200).json(company); // ส่งข้อมูลบริษัทกลับ
    } catch (err) {
        console.error("API Error [getCompanyById]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท" });
    }
};

// [POST] /api/v1/companies
// เพิ่มข้อมูลบริษัทใหม่ (ใช้เมื่อ HR หรือ Admin ลงทะเบียนบริษัทใหม่)
exports.createCompany = async (req, res) => {
    try {
        // สามารถเพิ่ม validation ตรวจสอบข้อมูลก่อนบันทึกได้ในอนาคต
        const newCompany = await CompanyModel.createCompany(req.body);
        res.status(201).json(newCompany); // ส่งข้อมูลบริษัทที่สร้างสำเร็จกลับ
    } catch (err) {
        console.error("API Error [createCompany]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างบริษัท" });
    }
};

// [PUT] /api/v1/companies/:id
// อัปเดตข้อมูลบริษัทตาม ID
exports.updateCompany = async (req, res) => {
    try {
        const { id } = req.params;
        // สามารถเพิ่ม validation ตรวจสอบความถูกต้องของข้อมูลได้ที่นี่
        const updatedCompany = await CompanyModel.updateCompany(id, req.body);

        if (!updatedCompany) {
            // ถ้าไม่พบข้อมูลบริษัทที่ต้องการอัปเดต
            return res.status(404).json({ message: "ไม่พบข้อมูลบริษัท" });
        }

        res.status(200).json(updatedCompany); // ส่งข้อมูลบริษัทที่อัปเดตแล้วกลับ
    } catch (err) {
        console.error("API Error [updateCompany]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลบริษัท" });
    }
};

// [DELETE] /api/v1/companies/:id
// ลบข้อมูลบริษัทออกจากระบบ (ลบจริง ไม่ใช่ soft delete)
exports.deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await CompanyModel.deleteCompany(id);

        if (!deleted) {
            // ถ้าไม่พบบริษัทตาม id ที่ระบุ
            return res.status(404).json({ message: "ไม่พบข้อมูลบริษัทที่ต้องการลบ" });
        }

        // ลบสำเร็จ ส่ง status 204 (No Content) กลับ
        res.status(204).send();
    } catch (err) {
        console.error("API Error [deleteCompany]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบข้อมูลบริษัท" });
    }
};
