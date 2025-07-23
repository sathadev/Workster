// backend/models/evaluationModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// --- 1. แยกฟังก์ชัน getById ออกมาเป็นฟังก์ชัน helper (ต้องรับ companyId ด้วย) ---
const getById = async (id, companyId) => { // <-- รับ companyId
    const sql = `SELECT * FROM evaluatework WHERE evaluatework_id = ? AND company_id = ?`; // <-- เพิ่ม WHERE clause
    const results = await query(sql, [id, companyId]); // <-- ส่ง companyId
    return results[0] || null;
};

// --- 2. สร้าง Object หลักสำหรับ Export ---
const Evaluation = {
    getAllEvaluations: async (companyId) => { // <-- รับ companyId
        const sql = `
            SELECT e.evaluatework_id, e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
            FROM evaluatework e
            JOIN employee emp ON e.emp_id = emp.emp_id
            WHERE e.company_id = ? -- <-- เพิ่ม WHERE clause
            ORDER BY e.create_at DESC
        `;
        return await query(sql, [companyId]); // <-- ส่ง companyId
    },

    saveEvaluation: async (data, companyId) => { // <-- รับ companyId
        const sql = `
            INSERT INTO evaluatework
            (emp_id, evaluatework_score1, evaluatework_score2, evaluatework_score3, evaluatework_score4, evaluatework_score5, evaluatework_totalscore, create_at, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `; // <-- เพิ่ม company_id
        const totalScore = [data.q1, data.q2, data.q3, data.q4, data.q5].reduce((sum, score) => sum + score, 0);
        const params = [data.emp_id, data.q1, data.q2, data.q3, data.q4, data.q5, totalScore, companyId]; // <-- ส่ง companyId

        const result = await query(sql, params);
        
        return await getById(result.insertId, companyId); // <-- ส่ง companyId
    },

    getByEmployeeId: async (emp_id, companyId) => { // <-- รับ companyId
        const sql = `
            SELECT * FROM evaluatework
            WHERE emp_id = ? AND company_id = ?
            ORDER BY create_at DESC
        `; // <-- เพิ่ม WHERE clause
        return await query(sql, [emp_id, companyId]); // <-- ส่ง companyId
    },
    
    getById: getById // Export ฟังก์ชัน helper ไปด้วย
};

module.exports = Evaluation;