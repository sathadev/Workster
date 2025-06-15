// backend/models/evaluationModel.js

const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// --- 1. แยกฟังก์ชัน getById ออกมาเป็นฟังก์ชัน helper ---
const getById = async (id) => {
  const sql = `SELECT * FROM evaluatework WHERE evaluatework_id = ?`;
  const results = await query(sql, [id]);
  return results[0] || null;
};


// --- 2. สร้าง Object หลักสำหรับ Export ---
const Evaluation = {
  getAllEvaluations: async () => {
    const sql = `
      SELECT e.evaluatework_id, e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
      FROM evaluatework e
      JOIN employee emp ON e.emp_id = emp.emp_id
      ORDER BY e.create_at DESC
    `;
    return await query(sql);
  },

  saveEvaluation: async (data) => {
    const sql = `
      INSERT INTO evaluatework 
      (emp_id, evaluatework_score1, evaluatework_score2, evaluatework_score3, evaluatework_score4, evaluatework_score5, evaluatework_totalscore, create_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const totalScore = [data.q1, data.q2, data.q3, data.q4, data.q5].reduce((sum, score) => sum + score, 0);
    const params = [data.emp_id, data.q1, data.q2, data.q3, data.q4, data.q5, totalScore];

    const result = await query(sql, params);
    
    // CHANGED: เรียกใช้ฟังก์ชัน helper ที่แยกออกมาโดยตรง
    return await getById(result.insertId);
  },

  getByEmployeeId: async (emp_id) => {
    const sql = `
      SELECT * FROM evaluatework 
      WHERE emp_id = ? 
      ORDER BY create_at DESC
    `;
    return await query(sql, [emp_id]);
  },
  
  // Export ฟังก์ชัน getById ไปด้วยเพื่อความสมบูรณ์
  getById: getById
};

module.exports = Evaluation;