// backend/models/salaryModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// สร้าง SQL Query ส่วนที่ใช้ซ้ำๆ เพื่อลดความซ้ำซ้อน
const SALARY_QUERY_FIELDS = `
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
`;

const SalaryModel = {
  // REFACTORED: เพิ่ม Pagination
  getAllSalaryInfo: async (page = 1, limit = 10) => {
    const countSql = `SELECT COUNT(*) as total FROM employee`;
    const [totalResult] = await query(countSql);
    const totalItems = totalResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    const offset = (page - 1) * limit;
    const dataSql = `${SALARY_QUERY_FIELDS} ORDER BY e.emp_name LIMIT ? OFFSET ?`;
    const salaries = await query(dataSql, [parseInt(limit), parseInt(offset)]);

    return { data: salaries, meta: { totalItems, totalPages, currentPage: parseInt(page) }};
  },

  // REFACTORED: เพิ่ม Pagination
  searchSalaryInfo: async (searchTerm, page = 1, limit = 10) => {
    const searchPattern = `%${searchTerm}%`;
    const countSql = `SELECT COUNT(e.emp_id) as total FROM employee e JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id WHERE e.emp_name LIKE ? OR jp.jobpos_name LIKE ?`;
    const [totalResult] = await query(countSql, [searchPattern, searchPattern]);
    const totalItems = totalResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    const offset = (page - 1) * limit;
    const dataSql = `${SALARY_QUERY_FIELDS} WHERE e.emp_name LIKE ? OR jp.jobpos_name LIKE ? ORDER BY e.emp_name LIMIT ? OFFSET ?`;
    const salaries = await query(dataSql, [searchPattern, searchPattern, parseInt(limit), parseInt(offset)]);
    
    return { data: salaries, meta: { totalItems, totalPages, currentPage: parseInt(page) }};
  },

  getSalaryByEmpId: async (empId) => {
    const sql = `${SALARY_QUERY_FIELDS} WHERE e.emp_id = ?`;
    const results = await query(sql, [empId]);
    return results[0] || null;
  },

  updateSalary: async (empId, data) => {
    const sql = `
      INSERT INTO salary (emp_id, salary_base, salary_allowance, salary_bonus, salary_ot, salary_deduction)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        salary_base = VALUES(salary_base), salary_allowance = VALUES(salary_allowance),
        salary_bonus = VALUES(salary_bonus), salary_ot = VALUES(salary_ot),
        salary_deduction = VALUES(salary_deduction)
    `;
    const values = [empId, data.salary_base, data.salary_allowance, data.salary_bonus, data.salary_ot, data.salary_deduction];
    await query(sql, values);
    
    // CHANGED: คืนค่าข้อมูลล่าสุดกลับไป
    return await SalaryModel.getSalaryByEmpId(empId);
  },
};

module.exports = SalaryModel;