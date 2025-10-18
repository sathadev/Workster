// backend/models/aboutModel.js
// Model สำหรับจัดการข้อมูลการตั้งค่าระบบ (Settings) ของแต่ละบริษัท

const query = require('../utils/db');

const About = {
  // ดึงข้อมูลการตั้งค่าของบริษัทตาม company_id
  getAbout: async (companyId) => {
    const results = await query(
      'SELECT * FROM about WHERE company_id = ? LIMIT 1',
      [companyId]
    );
    return results[0] || null; // ถ้าไม่มีข้อมูลให้คืนค่า null
  },

  // อัปเดตหรือสร้างข้อมูลการตั้งค่าของบริษัท
  updateAbout: async (data, companyId) => {
    // ตรวจสอบว่าบริษัทนี้มีข้อมูลอยู่แล้วหรือไม่
    const existingAbout = await query(
      'SELECT about_id FROM about WHERE company_id = ? LIMIT 1',
      [companyId]
    );

    if (existingAbout.length === 0) {
      // ถ้ายังไม่มีข้อมูล → เพิ่มข้อมูลใหม่ (INSERT)
      const insertSql = `
        INSERT INTO about (
          startwork, endwork, about_late, late_allowed_count, late_deduction_amount,
          about_sickleave, about_personalleave, about_annualleave, about_maternityleave,
          about_childcareleave, about_paternityleave, about_militaryleave,
          about_ordinationleave, about_sterilizationleave, about_trainingleave,
          about_funeralleave, work_days, company_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        data.startwork,
        data.endwork,
        data.about_late,
        data.late_allowed_count,
        data.late_deduction_amount,
        data.about_sickleave,
        data.about_personalleave,
        data.about_annualleave,
        data.about_maternityleave,
        data.about_childcareleave,
        data.about_paternityleave,
        data.about_militaryleave,
        data.about_ordinationleave,
        data.about_sterilizationleave,
        data.about_trainingleave,
        data.about_funeralleave,
        data.work_days,
        companyId,
      ];

      await query(insertSql, insertParams);
    } else {
      // ถ้ามีข้อมูลอยู่แล้ว → อัปเดต (UPDATE)
      const updateSql = `
        UPDATE about SET
          startwork = ?, endwork = ?, about_late = ?, late_allowed_count = ?, late_deduction_amount = ?,
          about_sickleave = ?, about_personalleave = ?, about_annualleave = ?, about_maternityleave = ?,
          about_childcareleave = ?, about_paternityleave = ?, about_militaryleave = ?,
          about_ordinationleave = ?, about_sterilizationleave = ?, about_trainingleave = ?,
          about_funeralleave = ?, work_days = ?
        WHERE company_id = ?
      `;

      const updateParams = [
        data.startwork,
        data.endwork,
        data.about_late,
        data.late_allowed_count,
        data.late_deduction_amount,
        data.about_sickleave,
        data.about_personalleave,
        data.about_annualleave,
        data.about_maternityleave,
        data.about_childcareleave,
        data.about_paternityleave,
        data.about_militaryleave,
        data.about_ordinationleave,
        data.about_sterilizationleave,
        data.about_trainingleave,
        data.about_funeralleave,
        data.work_days,
        companyId,
      ];

      await query(updateSql, updateParams);
    }

    // หลังจากอัปเดตหรือสร้างแล้ว → ดึงข้อมูลล่าสุดกลับไปให้ controller
    return await About.getAbout(companyId);
  },
};

module.exports = About;
