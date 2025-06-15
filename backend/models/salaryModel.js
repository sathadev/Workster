const util = require('util');
const db = require('../config/db');

// ทำให้ db.query สามารถใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

const SalaryModel = {
  /**
   * ดึงข้อมูลเงินเดือนของพนักงานทั้งหมด
   */
  getAllSalaryInfo: async () => {
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
    return await query(sql);
  },

  /**
   * ค้นหาข้อมูลเงินเดือนของพนักงาน
   */
  searchSalaryInfo: async (searchTerm) => {
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
    return await query(sql, [searchPattern, searchPattern]);
  },

  /**
   * ดึงข้อมูลเงินเดือนด้วยรหัสพนักงาน
   */
  getSalaryByEmpId: async (empId) => {
    const sql = `
      SELECT e.emp_id, e.emp_name,
        COALESCE(s.salary_base, 0) as salary_base,
        COALESCE(s.salary_allowance, 0) as salary_allowance,
        COALESCE(s.salary_bonus, 0) as salary_bonus,
        COALESCE(s.salary_ot, 0) as salary_ot,
        COALESCE(s.salary_deduction, 0) as salary_deduction,
        (
          COALESCE(s.salary_base, 0) + COALESCE(s.salary_allowance, 0) +
          COALESCE(s.salary_bonus, 0) + COALESCE(s.salary_ot, 0) -
          COALESCE(s.salary_deduction, 0)
        ) AS total_salary
      FROM employee e
      LEFT JOIN salary s ON e.emp_id = s.emp_id
      WHERE e.emp_id = ?
    `;
    const results = await query(sql, [empId]);
    // คืนค่า object แรกที่พบ หรือ null หากไม่เจอ
    return results[0] || null;
  },

  /**
   * อัปเดตข้อมูลเงินเดือน (หากไม่มีจะสร้างใหม่)
   */
  updateSalary: async (empId, data) => {
    // SQL นี้ใช้ ON DUPLICATE KEY UPDATE ซึ่งเป็นวิธีที่ดีมาก
    // หากมี emp_id อยู่แล้วจะ UPDATE, หากไม่มีจะ INSERT
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
    const values = [
      empId,
      data.salary_base,
      data.salary_allowance,
      data.salary_bonus,
      data.salary_ot,
      data.salary_deduction
    ];
    return await query(sql, values);
  },
};

module.exports = SalaryModel;