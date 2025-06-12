const util = require('util');
const db = require('../config/db');

// ทำให้ db.query สามารถใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

const Evaluation = {
  /**
   * ดึงประวัติการประเมินทั้งหมดพร้อมข้อมูลพนักงาน
   */
  getAllEvaluations: async () => {
    const sql = `
      SELECT e.evaluatework_id, e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
      FROM evaluatework e
      JOIN employee emp ON e.emp_id = emp.emp_id
      ORDER BY e.create_at DESC
    `;
    return await query(sql);
  },

  /**
   * บันทึกผลการประเมิน
   */
  saveEvaluation: async (data) => {
    const sql = `
      INSERT INTO evaluatework 
      (emp_id, evaluatework_score1, evaluatework_score2, evaluatework_score3, evaluatework_score4, evaluatework_score5, evaluatework_totalscore, create_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const totalScore = Number(data.q1) + Number(data.q2) + Number(data.q3) + Number(data.q4) + Number(data.q5);

    const params = [
      data.id,
      data.q1,
      data.q2,
      data.q3,
      data.q4,
      data.q5,
      totalScore
    ];

    return await query(sql, params);
  },

  /**
   * ดึงข้อมูลการประเมินด้วย ID
   */
  getById: async (id) => {
    const sql = `SELECT * FROM evaluatework WHERE evaluatework_id = ?`;
    const results = await query(sql, [id]);
    // คืนค่าเฉพาะ object แรก หรือ null หากไม่พบข้อมูล
    return results[0] || null;
  },

  /**
   * ดึงประวัติการประเมินทั้งหมดของพนักงานคนเดียว
   */
  getByEmployeeId: async (emp_id) => {
    const sql = `
      SELECT * FROM evaluatework 
      WHERE emp_id = ? 
      ORDER BY create_at DESC
    `;
    return await query(sql, [emp_id]);
  }
};

module.exports = Evaluation;