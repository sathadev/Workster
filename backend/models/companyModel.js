// backend/models/companyModel.js
const util = require('util');
const db = require('../config/db'); // ตรวจสอบให้แน่ใจว่าเส้นทางนี้ถูกต้องสำหรับไฟล์ db connection ของคุณ

const query = util.promisify(db.query).bind(db);

const CompanyModel = {
    /**
     * @desc ดึงข้อมูลบริษัททั้งหมดจากฐานข้อมูล
     * @returns {Promise<Array>} อาร์เรย์ของอ็อบเจกต์บริษัท
     */
    getAllCompanies: async () => {
        const sql = `
            SELECT 
                company_id, 
                company_name, 
                company_address_number, 
                company_moo, 
                company_building, 
                company_street, 
                company_soi, 
                company_subdistrict, 
                company_district, 
                company_province, 
                company_zip_code, 
                company_phone, 
                company_email, 
                company_description,
                company_status, /* <--- เพิ่มตรงนี้ */
                created_at,
                updated_at
            FROM companies
            ORDER BY company_name ASC
        `;
        return await query(sql);
    },

    /**
     * @desc ดึงข้อมูลบริษัทเดียวด้วย ID
     * @param {number} id - ID ของบริษัทที่ต้องการดึงข้อมูล
     * @returns {Promise<Object|null>} อ็อบเจกต์บริษัท หรือ null ถ้าไม่พบ
     */
    getCompanyById: async (id) => {
        const sql = `
            SELECT 
                company_id, 
                company_name, 
                company_address_number, 
                company_moo, 
                company_building, 
                company_street, 
                company_soi, 
                company_subdistrict, 
                company_district, 
                company_province, 
                company_zip_code, 
                company_phone, 
                company_email, 
                company_description,
                company_status, /* <--- เพิ่มตรงนี้ */
                created_at,
                updated_at
            FROM companies
            WHERE company_id = ?
        `;
        const results = await query(sql, [id]);
        return results[0] || null;
    },

    /**
     * @desc สร้างข้อมูลบริษัทใหม่ในฐานข้อมูล
     * @param {Object} companyData - ข้อมูลบริษัทที่จะสร้าง
     * @returns {Promise<Object>} อ็อบเจกต์บริษัทที่สร้างใหม่ (รวม ID)
     */
    createCompany: async (companyData) => {
        const {
            company_name,
            company_address_number,
            company_moo,
            company_building,
            company_street,
            company_soi,
            company_subdistrict,
            company_district,
            company_province,
            company_zip_code,
            company_phone,
            company_email,
            company_description
        } = companyData;

        const sql = `
            INSERT INTO companies (
                company_name, 
                company_address_number, 
                company_moo, 
                company_building, 
                company_street, 
                company_soi, 
                company_subdistrict, 
                company_district, 
                company_province, 
                company_zip_code, 
                company_phone, 
                company_email, 
                company_description,
                company_status      /* <--- เพิ่มตรงนี้ */
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) /* <--- เพิ่ม ? */
        `;
        const values = [
            company_name,
            company_address_number,
            company_moo,
            company_building,
            company_street,
            company_soi,
            company_subdistrict,
            company_district,
            company_province,
            company_zip_code,
            company_phone,
            company_email,
            company_description,
            'pending'   /* <--- กำหนดค่าเริ่มต้นเป็น 'pending' */
        ];
        const result = await query(sql, values);
        // ดึงข้อมูลบริษัทที่เพิ่งสร้างขึ้นมาเพื่อคืนค่ากลับไป
        return await CompanyModel.getCompanyById(result.insertId);
    },

    /**
     * @desc อัปเดตข้อมูลบริษัทในฐานข้อมูล
     * @param {number} id - ID ของบริษัทที่ต้องการอัปเดต
     * @param {Object} companyData - ข้อมูลบริษัทที่จะอัปเดต
     * @returns {Promise<Object|null>} อ็อบเจกต์บริษัทที่อัปเดตแล้ว หรือ null ถ้าไม่พบ
     */
    updateCompany: async (id, companyData) => {
        const {
            company_name,
            company_address_number,
            company_moo,
            company_building,
            company_street,
            company_soi,
            company_subdistrict,
            company_district,
            company_province,
            company_zip_code,
            company_phone,
            company_email,
            company_description
        } = companyData;

        const sql = `
            UPDATE companies SET 
                company_name = ?, 
                company_address_number = ?, 
                company_moo = ?, 
                company_building = ?, 
                company_street = ?, 
                company_soi = ?, 
                company_subdistrict = ?, 
                company_district = ?, 
                company_province = ?, 
                company_zip_code = ?, 
                company_phone = ?, 
                company_email = ?, 
                company_description = ?
            WHERE company_id = ?
        `;
        const values = [
            company_name,
            company_address_number,
            company_moo,
            company_building,
            company_street,
            company_soi,
            company_subdistrict,
            company_district,
            company_province,
            company_zip_code,
            company_phone,
            company_email,
            company_description,
            id
        ];
        await query(sql, values);
        // ดึงข้อมูลบริษัทที่อัปเดตแล้วเพื่อคืนค่ากลับไป
        return await CompanyModel.getCompanyById(id);
    },

    /**
     * @desc อัปเดตสถานะของบริษัท (approved/rejected)
     * @param {number} companyId - ID ของบริษัทที่ต้องการอัปเดตสถานะ
     * @param {string} status - สถานะใหม่ ('approved' หรือ 'rejected')
     * @returns {Promise<Object|null>} อ็อบเจกต์บริษัทที่อัปเดตแล้ว หรือ null ถ้าไม่พบ
     */
    updateCompanyStatus: async (companyId, status) => {
        const sql = `UPDATE companies SET company_status = ? WHERE company_id = ?`;
        await query(sql, [status, companyId]);
        return await CompanyModel.getCompanyById(companyId);
    },

    /**
     * @desc ลบข้อมูลบริษัทจากฐานข้อมูล
     * @param {number} id - ID ของบริษัทที่ต้องการลบ
     * @returns {Promise<boolean>} true ถ้าลบสำเร็จ, false ถ้าไม่พบ
     */
    deleteCompany: async (id) => {
        const sql = `DELETE FROM companies WHERE company_id = ?`;
        const result = await query(sql, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = CompanyModel;