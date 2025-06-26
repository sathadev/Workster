// backend/models/aboutModel.js
const util = require('util');
const db = require('../config/db'); // ตรวจสอบ Path ให้ถูกต้อง

const query = util.promisify(db.query).bind(db);

const About = {
  getAbout: async () => {
    const results = await query('SELECT * FROM about LIMIT 1');
    return results[0] || null;
  },

  updateAbout: async (data) => {
    const sql = `
      UPDATE about SET 
        startwork = ?, endwork = ?, about_late = ?, about_sickleave = ?, 
        about_personalleave = ?, about_annualleave = ?, about_maternityleave = ?, 
        about_childcareleave = ?, about_paternityleave = ?, about_militaryleave = ?, 
        about_ordinationleave = ?, about_sterilizationleave = ?, about_trainingleave = ?, 
        about_funeralleave = ?, work_days = ?
      LIMIT 1
    `;
    
    const params = [
      data.startwork, data.endwork, data.about_late, data.about_sickleave,
      data.about_personalleave, data.about_annualleave, data.about_maternityleave,
      data.about_childcareleave, data.about_paternityleave, data.about_militaryleave,
      data.about_ordinationleave, data.about_sterilizationleave, data.about_trainingleave,
      data.about_funeralleave, data.work_days,
    ];

    await query(sql, params);

    // CHANGED: หลังจากอัปเดตแล้ว ให้ดึงข้อมูลล่าสุดกลับไปคืนค่า
    return await About.getAbout();
  },
};

module.exports = About;