// backend/models/salaryModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

// สร้าง SQL Query ส่วนที่ใช้ซ้ำๆ เพื่อลดความซ้ำซ้อน
const SALARY_QUERY_FIELDS = `
    SELECT e.emp_id, e.emp_name, e.emp_status, jp.jobpos_name,
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
 getAll: async (options = {}) => {
        const {
            search = '',
            page = 1,
            limit = 10,
            sort = 'emp_name',
            order = 'asc',
            jobpos_id = null
        } = options;

        let params = [];
        let whereClauses = [];

        // 1. Filter: แสดงเฉพาะพนักงานที่ยัง 'active' เสมอ
        whereClauses.push(`e.emp_status = 'active'`);
        
        // 2. Filter: ค้นหาตามชื่อหรือตำแหน่ง
        if (search) {
            whereClauses.push(`(e.emp_name LIKE ? OR jp.jobpos_name LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }
        
        // 3. Filter: กรองตามตำแหน่ง
        if (jobpos_id) {
            whereClauses.push(`e.jobpos_id = ?`);
            params.push(jobpos_id);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // --- นับจำนวนทั้งหมดสำหรับ Pagination ---
        const countSql = `SELECT COUNT(e.emp_id) as total FROM employee e JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id ${whereSql}`;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // --- ดึงข้อมูลพร้อมเรียงลำดับและแบ่งหน้า ---
        const sortableColumns = {
            emp_name: 'e.emp_name',
            jobpos_name: 'jp.jobpos_name',
            salary_base: 'salary_base',
            total_salary: 'total_salary',
            jobpos_id: 'e.jobpos_id'
        };
        const sortColumn = sortableColumns[sort] || sortableColumns.emp_name;
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const offset = (page - 1) * limit;
        const dataSql = `
            ${SALARY_QUERY_FIELDS}
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const salaries = await query(dataSql, finalParams);
        
        return {
            data: salaries,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) }
        };
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