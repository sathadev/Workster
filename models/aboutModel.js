const util = require('util');
const db = require('../db'); // อ้างอิงจากโค้ดของคุณ

// ทำให้ db.query สามารถใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

const About = {
  /**
   * ดึงข้อมูลการตั้งค่าระบบ (เกี่ยวกับ)
   * @returns {Promise<object|null>} ข้อมูลการตั้งค่า หรือ null หากไม่มี
   */
  getAbout: async () => {
    const results = await query('SELECT * FROM about LIMIT 1');
    // คืนค่า object แรกที่พบ หรือ null หากตารางว่าง
    return results[0] || null;
  },

  /**
   * อัปเดตข้อมูลการตั้งค่าระบบ
   * @param {object} data - ข้อมูลใหม่ที่จะอัปเดต
   * @returns {Promise<object>} ผลลัพธ์จากการอัปเดต
   */
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

    return await query(sql, params);
  },
};

module.exports = About;