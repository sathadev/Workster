// backend/models/companyModel.js
// Model สำหรับจัดการข้อมูลบริษัท (Company) ในระบบ เช่น เพิ่ม แก้ไข ลบ และดึงข้อมูลบริษัท

const query = require('../utils/db'); // ใช้สำหรับรันคำสั่ง SQL ผ่าน connection pool

const CompanyModel = {
    // [GET] ดึงข้อมูลบริษัททั้งหมด (รองรับการค้นหา, กรองสถานะ, และแบ่งหน้า)
    getAllCompanies: async (options = {}) => {
        const { search = '', status = '', page = 1, limit = 10 } = options;

        let params = [];
        let whereClauses = [];

        // กรองข้อมูลตามคำค้นหาชื่อบริษัท
        if (search) {
            whereClauses.push(`company_name LIKE ?`);
            params.push(`%${search}%`);
        }

        // กรองตามสถานะบริษัท เช่น approved / pending / rejected
        if (status) {
            whereClauses.push(`company_status = ?`);
            params.push(status);
        }

        // สร้าง WHERE clause จากเงื่อนไขทั้งหมด
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. นับจำนวนรายการทั้งหมด (สำหรับ pagination)
        const countSql = `SELECT COUNT(company_id) as total FROM companies ${whereSql}`;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // 2. ดึงข้อมูลบริษัทจริง พร้อมจำกัดจำนวนและ offset
        const offset = (page - 1) * limit;
        const dataSql = `
            SELECT 
                company_id, company_name, company_address_number, company_moo, company_building,
                company_street, company_soi, company_subdistrict, company_district,
                company_province, company_zip_code, company_phone, company_email,
                company_description, company_status, created_at, updated_at
            FROM companies
            ${whereSql}
            ORDER BY created_at DESC, company_name ASC
            LIMIT ? OFFSET ?
        `;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const companies = await query(dataSql, finalParams);

        // ส่งข้อมูลกลับพร้อมข้อมูล meta ของหน้า
        return {
            data: companies,
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit),
            },
        };
    },

    // [GET] ดึงข้อมูลบริษัทตาม company_id
    getCompanyById: async (id) => {
        const sql = `
            SELECT 
                company_id, company_name, company_address_number, company_moo, company_building,
                company_street, company_soi, company_subdistrict, company_district,
                company_province, company_zip_code, company_phone, company_email,
                company_description, company_status, created_at, updated_at
            FROM companies
            WHERE company_id = ?
        `;
        const results = await query(sql, [id]);
        return results[0] || null; // ถ้าไม่พบให้คืนค่า null
    },

    // [POST] เพิ่มข้อมูลบริษัทใหม่
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
            company_description,
        } = companyData;

        // ตั้งสถานะเริ่มต้นของบริษัทใหม่เป็น "pending"
        const sql = `
            INSERT INTO companies (
                company_name, company_address_number, company_moo, company_building,
                company_street, company_soi, company_subdistrict, company_district,
                company_province, company_zip_code, company_phone, company_email,
                company_description, company_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            'pending',
        ];

        const result = await query(sql, values);

        // ดึงข้อมูลบริษัทที่เพิ่งถูกเพิ่มกลับมาแสดง
        return await CompanyModel.getCompanyById(result.insertId);
    },

    // [PUT] อัปเดตข้อมูลบริษัทตาม ID
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
            company_description,
        } = companyData;

        const sql = `
            UPDATE companies SET 
                company_name = ?, company_address_number = ?, company_moo = ?, 
                company_building = ?, company_street = ?, company_soi = ?, 
                company_subdistrict = ?, company_district = ?, company_province = ?, 
                company_zip_code = ?, company_phone = ?, company_email = ?, 
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
            id,
        ];

        await query(sql, values);

        // คืนค่าข้อมูลบริษัทที่อัปเดตแล้ว
        return await CompanyModel.getCompanyById(id);
    },

    // [PATCH] อัปเดตสถานะของบริษัท (approved หรือ rejected)
    updateCompanyStatus: async (companyId, status) => {
        // ตรวจสอบความถูกต้องของสถานะก่อนอัปเดต
        if (!['approved', 'rejected'].includes(status)) {
            throw new Error('สถานะไม่ถูกต้อง: ต้องเป็น "approved" หรือ "rejected" เท่านั้น');
        }

        const sql = `UPDATE companies SET company_status = ? WHERE company_id = ?`;
        const result = await query(sql, [status, companyId]);

        // หากไม่มีการเปลี่ยนแปลงแถว (ไม่พบบริษัท)
        if (result.affectedRows === 0) {
            return null;
        }

        // ดึงข้อมูลบริษัทที่อัปเดตแล้วกลับไปแสดง
        return await CompanyModel.getCompanyById(companyId);
    },

    // [DELETE] ลบข้อมูลบริษัทตาม ID
    deleteCompany: async (id) => {
        const sql = `DELETE FROM companies WHERE company_id = ?`;
        const result = await query(sql, [id]);
        return result.affectedRows > 0; // คืน true ถ้าลบสำเร็จ
    },
};

module.exports = CompanyModel;
