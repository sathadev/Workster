const db = require('../config/db');

const Evaluation = {
  getAllEvaluations: (callback) => {
    const sql = `
      SELECT e.evaluatework_id, e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
      FROM evaluatework e
      JOIN employee emp ON e.emp_id = emp.emp_id
      ORDER BY e.create_at DESC
    `;
    db.query(sql, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },

  saveEvaluation: (data, callback) => {
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

    db.query(sql, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  },

  getById: (id, callback) => {
    const sql = `SELECT * FROM evaluatework WHERE evaluatework_id = ?`;
    db.query(sql, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  },

  getByEmployeeId: (emp_id, callback) => {
    const sql = `
      SELECT * FROM evaluatework 
      WHERE emp_id = ? 
      ORDER BY create_at DESC
    `;
    db.query(sql, [emp_id], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
};

module.exports = Evaluation;
