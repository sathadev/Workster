const db = require('../config/db');

exports.getAllSalaryInfo = function(callback) {
  const sql = `
    SELECT e.emp_id, e.emp_name, jp.jobpos_name,
           COALESCE(s.salary_base, 0) as salary_base, 
           COALESCE(s.salary_allowance, 0) as salary_allowance, 
           COALESCE(s.salary_bonus, 0) as salary_bonus, 
           COALESCE(s.salary_ot, 0) as salary_ot, 
           COALESCE(s.salary_deduction, 0) as salary_deduction,
           (COALESCE(s.salary_base, 0) + COALESCE(s.salary_allowance, 0) + 
            COALESCE(s.salary_bonus, 0) + COALESCE(s.salary_ot, 0) - 
            COALESCE(s.salary_deduction, 0)) AS total_salary
    FROM employee e
    JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
    LEFT JOIN salary s ON e.emp_id = s.emp_id
    ORDER BY e.emp_name
  `;
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return callback(err, null);
    }
    callback(null, results);
  });
};

exports.searchSalaryInfo = function(searchTerm, callback) {
  const sql = `
    SELECT e.emp_id, e.emp_name, jp.jobpos_name,
           COALESCE(s.salary_base, 0) as salary_base, 
           COALESCE(s.salary_allowance, 0) as salary_allowance, 
           COALESCE(s.salary_bonus, 0) as salary_bonus, 
           COALESCE(s.salary_ot, 0) as salary_ot, 
           COALESCE(s.salary_deduction, 0) as salary_deduction,
           (COALESCE(s.salary_base, 0) + COALESCE(s.salary_allowance, 0) + 
            COALESCE(s.salary_bonus, 0) + COALESCE(s.salary_ot, 0) - 
            COALESCE(s.salary_deduction, 0)) AS total_salary
    FROM employee e
    JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
    LEFT JOIN salary s ON e.emp_id = s.emp_id
    WHERE e.emp_name LIKE ? OR jp.jobpos_name LIKE ?
    ORDER BY e.emp_name
  `;
  
  const searchPattern = `%${searchTerm}%`;
  
  db.query(sql, [searchPattern, searchPattern], (err, results) => {
    if (err) {
      console.error('Search query error:', err);
      return callback(err, null);
    }
    callback(null, results);
  });
};


exports.getSalaryByEmpId = function(empId, callback) {
  const sql = `
    SELECT e.emp_id, e.emp_name,
      COALESCE(s.salary_base, 0) as salary_base,
      COALESCE(s.salary_allowance, 0) as salary_allowance,
      COALESCE(s.salary_bonus, 0) as salary_bonus,
      COALESCE(s.salary_ot, 0) as salary_ot,
      COALESCE(s.salary_deduction, 0) as salary_deduction
    FROM employee e
    LEFT JOIN salary s ON e.emp_id = s.emp_id
    WHERE e.emp_id = ?
  `;

  db.query(sql, [empId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0]);
  });
};

exports.updateSalary = function(empId, data, callback) {
  const sql = `
    INSERT INTO salary (emp_id, salary_base, salary_allowance, salary_bonus, salary_ot, salary_deduction)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      salary_base = VALUES(salary_base),
      salary_allowance = VALUES(salary_allowance),
      salary_bonus = VALUES(salary_bonus),
      salary_ot = VALUES(salary_ot),
      salary_deduction = VALUES(salary_deduction)
  `;

  const values = [empId, data.salary_base, data.salary_allowance, data.salary_bonus, data.salary_ot, data.salary_deduction];
  db.query(sql, values, callback);
};
