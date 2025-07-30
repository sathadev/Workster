// backend/models/companyModel.js
const util = require('util');
const db = require('../config/db'); // ตรวจสอบให้แน่ใจว่าเส้นทางนี้ถูกต้องสำหรับไฟล์ db connection ของคุณ

const query = util.promisify(db.query).bind(db);

const CompanyModel = {
    /**
     * @desc ดึงข้อมูลบริษัททั้งหมดจากฐานข้อมูล พร้อมรองรับการกรองและแบ่งหน้า
     * @param {object} options - อ็อพชันสำหรับ search, status, page, limit
     * @returns {Promise<{data: Array, meta: object}>} - ข้อมูลบริษัทพร้อมข้อมูล meta สำหรับการแบ่งหน้า
     */
    getAllCompanies: async (options = {}) => { // รับ options parameter
        const { search = '', status = '', page = 1, limit = 10 } = options;

        let params = [];
        let whereClauses = [];

        if (search) {
            whereClauses.push(`company_name LIKE ?`);
            params.push(`%${search}%`);
        }
        if (status) {
            whereClauses.push(`company_status = ?`); // แก้ไขชื่อตัวแปรสะกดผิด `whereClaases` -> `whereClauses`
            params.push(status);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. นับจำนวนทั้งหมด
        const countSql = `SELECT COUNT(company_id) as total FROM companies ${whereSql}`;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // 2. ดึงข้อมูลจริงพร้อม pagination
        const offset = (page - 1) * limit;
        const dataSql = `
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
                company_status, 
                created_at,
                updated_at
            FROM companies
            ${whereSql}
            ORDER BY created_at DESC, company_name ASC
            LIMIT ? OFFSET ?
        `;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const companies = await query(dataSql, finalParams);

        return {
            data: companies,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
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
                company_status, 
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
                company_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            'pending'
        ];
        const result = await query(sql, values);
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
        return await CompanyModel.getCompanyById(id);
    },

    /**
     * @desc อัปเดตสถานะของบริษัท (approved/rejected)
     * @param {number} companyId - ID ของบริษัทที่ต้องการอัปเดตสถานะ
     * @param {string} status - สถานะใหม่ ('approved' หรือ 'rejected')
     * @returns {Promise<Object|null>} อ็อบเจกต์บริษัทที่อัปเดตแล้ว หรือ null ถ้าไม่พบ
     */
    updateCompanyStatus: async (companyId, status) => {
        // ตรวจสอบสถานะที่เข้ามาต้องเป็น 'approved' หรือ 'rejected' เท่านั้น
        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('สถานะไม่ถูกต้อง: ต้องเป็น "approved" หรือ "rejected" เท่านั้น');
        }

        const sql = `UPDATE companies SET company_status = ? WHERE company_id = ?`;
        const result = await query(sql, [status, companyId]);

        if (result.affectedRows === 0) {
            return null; // ไม่พบบริษัทหรือสถานะเดิมอยู่แล้ว
        }
        return await CompanyModel.getCompanyById(companyId); // ดึงข้อมูลบริษัทที่อัปเดตแล้วกลับไป
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