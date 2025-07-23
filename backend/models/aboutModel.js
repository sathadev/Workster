// backend/models/aboutModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

const About = {
    // ดึงข้อมูลการตั้งค่าสำหรับบริษัทที่ระบุ
    getAbout: async (companyId) => { // <--- รับ companyId
        const results = await query('SELECT * FROM about WHERE company_id = ? LIMIT 1', [companyId]); // <--- กรองด้วย company_id
        return results[0] || null;
    },

    // อัปเดตข้อมูลการตั้งค่าสำหรับบริษัทที่ระบุ
    updateAbout: async (data, companyId) => { // <--- รับ companyId
        // ตรวจสอบว่ามีข้อมูล about ของบริษัทนี้อยู่แล้วหรือไม่
        // ถ้าไม่มี (เป็นบริษัทที่เพิ่งสร้าง/ไม่มีการตั้งค่ามาก่อน) ให้ทำการ INSERT แทน UPDATE
        const existingAbout = await query('SELECT about_id FROM about WHERE company_id = ? LIMIT 1', [companyId]);

        if (existingAbout.length === 0) {
            // ไม่มีข้อมูล about สำหรับบริษัทนี้, ทำการ INSERT
            const insertSql = `
                INSERT INTO about (startwork, endwork, about_late, about_sickleave,
                about_personalleave, about_annualleave, about_maternityleave,
                about_childcareleave, about_paternityleave, about_militaryleave,
                about_ordinationleave, about_sterilizationleave, about_trainingleave,
                about_funeralleave, work_days, company_id) -- <--- เพิ่ม company_id
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const insertParams = [
                data.startwork, data.endwork, data.about_late, data.about_sickleave,
                data.about_personalleave, data.about_annualleave, data.about_maternityleave,
                data.about_childcareleave, data.about_paternityleave, data.about_militaryleave,
                data.about_ordinationleave, data.about_sterilizationleave, data.about_trainingleave,
                data.about_funeralleave, data.work_days, companyId // <--- ใส่ companyId
            ];
            await query(insertSql, insertParams);
        } else {
            // มีข้อมูลอยู่แล้ว, ทำการ UPDATE
            const updateSql = `
                UPDATE about SET
                startwork = ?, endwork = ?, about_late = ?, about_sickleave = ?,
                about_personalleave = ?, about_annualleave = ?, about_maternityleave = ?,
                about_childcareleave = ?, about_paternityleave = ?, about_militaryleave = ?,
                about_ordinationleave = ?, about_sterilizationleave = ?, about_trainingleave = ?,
                about_funeralleave = ?, work_days = ?
                WHERE company_id = ? -- <--- กรองด้วย company_id
            `;
            
            const updateParams = [
                data.startwork, data.endwork, data.about_late, data.about_sickleave,
                data.about_personalleave, data.about_annualleave, data.about_maternityleave,
                data.about_childcareleave, data.about_paternityleave, data.about_militaryleave,
                data.about_ordinationleave, data.about_sterilizationleave, data.about_trainingleave,
                data.about_funeralleave, data.work_days,
                companyId // <--- ใส่ companyId
            ];
            await query(updateSql, updateParams);
        }

        // หลังจาก INSERT/UPDATE แล้ว ให้ดึงข้อมูลล่าสุดกลับไปคืนค่า
        return await About.getAbout(companyId); // <--- ส่ง companyId
    },
};

module.exports = About;