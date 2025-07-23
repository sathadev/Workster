// backend/models/jobposModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

const Jobpos = {
    // ดึงตำแหน่งงานทั้งหมด (ทั้ง Global และ Tenant-Specific ของบริษัทนั้นๆ)
    getAll: async (companyId) => { // <--- รับ companyId
        const sql = `
            SELECT * FROM jobpos
            WHERE company_id IS NULL OR company_id = ? -- <--- ดึงตำแหน่ง Global (company_id IS NULL) หรือของบริษัทนี้
            ORDER BY jobpos_name
        `;
        return await query(sql, [companyId]); // <--- ส่ง companyId
    },

    // ดึงตำแหน่งงานด้วย ID (ต้องระบุว่าเป็น Global หรือของบริษัทนั้น)
    getById: async (id, companyId) => { // <--- รับ companyId
        const sql = `
            SELECT * FROM jobpos
            WHERE jobpos_id = ? AND (company_id IS NULL OR company_id = ?)
        `;
        const results = await query(sql, [id, companyId]); // <--- ส่ง companyId
        return results[0] || null;
    },

    // สร้างตำแหน่งงานใหม่ (จะเป็น Tenant-Specific เสมอ)
    create: async (jobpos_name, companyId) => { // <--- รับ companyId
        // ตรวจสอบชื่อซ้ำภายในบริษัทเดียวกัน หรือชื่อซ้ำกับ Global
        const existing = await query(`
            SELECT jobpos_id FROM jobpos
            WHERE jobpos_name = ? AND (company_id = ? OR company_id IS NULL)
        `, [jobpos_name, companyId]);

        if (existing.length > 0) {
            const error = new Error('มีชื่อตำแหน่งงานนี้อยู่แล้วในบริษัทของคุณ หรือเป็นชื่อตำแหน่ง Global ที่มีอยู่แล้ว');
            error.statusCode = 409;
            throw error;
        }
        
        // ตำแหน่งที่สร้างใหม่จะผูกกับบริษัทที่สร้างเท่านั้น
        const sql = 'INSERT INTO jobpos (jobpos_name, company_id) VALUES (?, ?)';
        const result = await query(sql, [jobpos_name, companyId]);
        return await Jobpos.getById(result.insertId, companyId);
    },

    // อัปเดตตำแหน่งงาน (ต้องเป็นตำแหน่งของบริษัทนั้นๆ เท่านั้น)
    update: async (id, jobpos_name, companyId) => { // <--- รับ companyId
        // ตรวจสอบว่าพยายามแก้ไขตำแหน่ง Global หรือไม่
        const targetJobpos = await Jobpos.getById(id, companyId);
        if (targetJobpos && targetJobpos.company_id === null) {
            // นี่คือตำแหน่ง Global ห้ามแก้ไขผ่าน API ปกติ (อาจต้องมี API แยกสำหรับ Super Admin)
            const error = new Error('ไม่สามารถแก้ไขตำแหน่งงาน Global ได้');
            error.statusCode = 403; // Forbidden
            throw error;
        }

        // ตรวจสอบชื่อซ้ำ (เมื่ออัปเดต ต้องไม่ซ้ำกับตำแหน่งอื่นในบริษัทเดียวกัน หรือชื่อ Global)
        const existing = await query(`
            SELECT jobpos_id FROM jobpos
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
    delete: async (id, companyId) => { // <--- รับ companyId
        // ตรวจสอบว่าพยายามลบตำแหน่ง Global หรือไม่
        const targetJobpos = await Jobpos.getById(id, companyId);
        if (targetJobpos && targetJobpos.company_id === null) {
            const error = new Error('ไม่สามารถลบตำแหน่งงาน Global ได้');
            error.statusCode = 403; // Forbidden
            throw error;
        }
        // ลบเฉพาะตำแหน่งที่เป็นของบริษัทนี้
        return await query('DELETE FROM jobpos WHERE jobpos_id = ? AND company_id = ?', [id, companyId]);
    },
};

module.exports = Jobpos;