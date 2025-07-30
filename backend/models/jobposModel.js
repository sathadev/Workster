// backend/models/jobposModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

const Jobpos = {
    // ดึงตำแหน่งงานทั้งหมด (ทั้ง Global และ Tenant-Specific ของบริษัทนั้นๆ)
    // สำหรับ Admin/HR ปกติ: companyId จะมีค่า -> ดึง Global (company_id IS NULL) และของบริษัทตัวเอง
    // สำหรับ Super Admin: companyId จะเป็น null -> ดึงทุกตำแหน่งงานในระบบ
    getAll: async (companyId) => { 
        let sql = `SELECT * FROM jobpos`;
        let params = [];

        if (companyId !== null) { // ถ้าไม่ใช่ Super Admin (คือมี companyId สังกัด)
            sql += ` WHERE company_id IS NULL OR company_id = ?`;
            params.push(companyId);
        }
        // ถ้า companyId เป็น null (คือ Super Admin), จะไม่มี WHERE clause เพิ่มเติม
        // ซึ่งจะทำให้ดึงทุกตำแหน่งงานในระบบ (Global และทุกบริษัท)

        sql += ` ORDER BY jobpos_name`;
        return await query(sql, params);
    },

    // ดึงตำแหน่งงานด้วย ID (ต้องระบุว่าเป็น Global หรือของบริษัทนั้น)
    // สำหรับ Admin/HR ปกติ: จะตรวจสอบว่าตำแหน่งนั้นเป็น Global หรือของบริษัทตัวเอง
    // สำหรับ Super Admin: จะดึงตำแหน่งงานด้วย ID โดยไม่สนใจ companyId (เห็นทุกอัน)
    getById: async (id, companyId) => {
        let sql = `SELECT * FROM jobpos WHERE jobpos_id = ?`;
        let params = [id];

        if (companyId !== null) { // ถ้าไม่ใช่ Super Admin
            sql += ` AND (company_id IS NULL OR company_id = ?)`;
            params.push(companyId);
        }
        const results = await query(sql, params);
        return results[0] || null;
    },

    // สร้างตำแหน่งงานใหม่ (จะเป็น Tenant-Specific เสมอ)
    create: async (jobpos_name, companyId) => { // ลบ isSuperAdmin parameter
        // ตรวจสอบชื่อซ้ำภายในบริษัทเดียวกัน หรือชื่อซ้ำกับ Global
        const existing = await query(`
            SELECT jobpos_id
            FROM jobpos
            WHERE jobpos_name = ? AND (company_id = ? OR company_id IS NULL)
        `, [jobpos_name, companyId]);
        
        if (existing.length > 0) {
            const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือเป็นชื่อตำแหน่ง Global ที่มีอยู่แล้ว');
            error.statusCode = 409;
            throw error;
        }
        
        // ตำแหน่งที่สร้างใหม่จะผูกกับบริษัทที่สร้างเท่านั้น (companyId จะไม่เป็น null ที่นี่)
        const sql = 'INSERT INTO jobpos (jobpos_name, company_id) VALUES (?, ?)';
        const result = await query(sql, [jobpos_name, companyId]);
        return await Jobpos.getById(result.insertId, companyId);
    },

    // อัปเดตตำแหน่งงาน (ต้องเป็นตำแหน่งของบริษัทนั้นๆ เท่านั้น)
    update: async (id, jobpos_name, companyId) => { // ลบ isSuperAdmin parameter
        // ตรวจสอบว่าพยายามแก้ไขตำแหน่ง Global หรือไม่ (สำหรับ Admin/HR ปกติ)
        const targetJobpos = await Jobpos.getById(id, companyId); // ใช้ getById ที่มี filter companyId
        if (!targetJobpos) {
            const error = new Error('ไม่พบตำแหน่งงานที่จะอัปเดต หรือคุณไม่มีสิทธิ์แก้ไข');
            error.statusCode = 404;
            throw error;
        }
        if (targetJobpos.company_id === null) {
            const error = new Error('คุณไม่มีสิทธิ์แก้ไขตำแหน่งงาน Global ได้');
            error.statusCode = 403; // Forbidden
            throw error;
        }

        // ตรวจสอบชื่อซ้ำ (เมื่ออัปเดต ต้องไม่ซ้ำกับตำแหน่งอื่นในบริษัทเดียวกัน หรือชื่อ Global)
        const existing = await query(`
            SELECT jobpos_id
            FROM jobpos
            WHERE jobpos_name = ? AND (company_id = ? OR company_id IS NULL) AND jobpos_id != ?
        `, [jobpos_name, companyId, id]);
        
        if (existing.length > 0) {
            const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือเป็นชื่อตำแหน่ง Global ที่มีอยู่แล้ว');
            error.statusCode = 409;
            throw error;
        }

        // อัปเดตเฉพาะตำแหน่งที่เป็นของบริษัทนี้
        const sql = 'UPDATE jobpos SET jobpos_name = ? WHERE jobpos_id = ? AND company_id = ?';
        await query(sql, [jobpos_name, id, companyId]);
        return await Jobpos.getById(id, companyId);
    },

    // ลบตำแหน่งงาน (ต้องเป็นตำแหน่งของบริษัทนั้นๆ เท่านั้น)
    delete: async (id, companyId) => { // ลบ isSuperAdmin parameter
        // ตรวจสอบว่าพยายามลบตำแหน่ง Global หรือไม่ (สำหรับ Admin/HR ปกติ)
        const targetJobpos = await Jobpos.getById(id, companyId);
        if (!targetJobpos) {
            const error = new Error('ไม่พบตำแหน่งงานที่จะลบ หรือคุณไม่มีสิทธิ์');
            error.statusCode = 404;
            throw error;
        }
        if (targetJobpos.company_id === null) {
            const error = new Error('ไม่สามารถลบตำแหน่งงาน Global ได้');
            error.statusCode = 403; // Forbidden
            throw error;
        }
        if (targetJobpos.company_id !== companyId) {
            const error = new Error('คุณไม่มีสิทธิ์ลบตำแหน่งงานนี้');
            error.statusCode = 403;
            throw error;
        }

        // ลบเฉพาะตำแหน่งที่เป็นของบริษัทนี้
        const result = await query('DELETE FROM jobpos WHERE jobpos_id = ? AND company_id = ?', [id, companyId]);
        return result.affectedRows > 0;
    },
};

module.exports = Jobpos;