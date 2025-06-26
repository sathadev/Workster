const util = require('util');
const db = require('../config/db');

// ทำให้ db.query ใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

// REFACTORED: กำหนดฟิลด์ที่ปลอดภัยสำหรับดึงข้อมูล เพื่อหลีกเลี่ยงการส่งข้อมูลรหัสผ่าน
const SAFE_EMPLOYEE_FIELDS = `
    e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel, 
    e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, e.emp_status,
    j.jobpos_name
`;


const Employee = {
  // ดึงข้อมูลการประเมินทั้งหมด (ไม่เปลี่ยนแปลง)
getAll: async (options = {}) => {
        // 1. กำหนดค่าเริ่มต้นสำหรับ options ทั้งหมด
        const {
            sort = 'emp_name',
            order = 'asc',
            page = 1,
            limit = 10,
            jobpos_id = null,
            status = null,
            search = ''
        } = options;

        let params = [];
        let whereClauses = [];

        // 2. สร้างเงื่อนไข WHERE แบบไดนามิก
        if (search) {
            whereClauses.push(`(e.emp_name LIKE ? OR j.jobpos_name LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }
        if (jobpos_id) {
            whereClauses.push(`e.jobpos_id = ?`);
            params.push(jobpos_id);
        }
        if (status) {
            whereClauses.push(`e.emp_status = ?`);
            params.push(status);
        }
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 3. สร้าง SQL สำหรับนับจำนวนทั้งหมด (สำหรับ Pagination)
        const countSql = `SELECT COUNT(e.emp_id) as total FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id ${whereSql}`;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // 4. สร้าง SQL สำหรับดึงข้อมูล พร้อม Logic การเรียงลำดับที่ปลอดภัย
        const sortableColumns = {
            emp_name: 'e.emp_name',
            jobpos_name: 'j.jobpos_name',
            emp_startwork: 'e.emp_startwork',
            jobpos_id: 'e.jobpos_id'
        };
        const sortColumn = sortableColumns[sort] || sortableColumns.emp_name;
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
        `;
        
        // 5. เพิ่ม LIMIT / OFFSET และส่ง Query
        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const employees = await query(dataSql, finalParams);

        // 6. คืนค่าข้อมูลและ meta
        return {
            data: employees,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },


  /**
   * REFACTORED: ดึงข้อมูลพนักงานทั้งหมดพร้อมเรียงลำดับและแบ่งหน้า (Pagination)
   * @param {string} sortField - ฟิลด์ที่ใช้เรียงลำดับ
   * @param {string} sortOrder - 'ASC' หรือ 'DESC'
   * @param {number} page - หน้าปัจจุบัน
   * @param {number} limit - จำนวนรายการต่อหน้า
   * @returns {Promise<{data: Array, meta: object}>} - ข้อมูลพนักงานพร้อมข้อมูล meta สำหรับการแบ่งหน้า
   */
 getAllSorted: async (sortField, sortOrder, page = 1, limit = 10) => {
    const countSql = `SELECT COUNT(emp_id) as total FROM employee`;
    const [totalResult] = await query(countSql);
    const totalItems = totalResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    let dataSql = `
      SELECT ${SAFE_EMPLOYEE_FIELDS}
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    `;

    // --- CORRECTED: ปรับปรุง Logic การ ORDER BY ---
    if (sortField === 'emp_name') {
        dataSql += ` ORDER BY CAST(REGEXP_SUBSTR(e.emp_name, '[0-9]+') AS UNSIGNED) ${sortOrder}, e.emp_name ${sortOrder}`;
    } else if (sortField === 'jobpos_name') {
        // เมื่อ sort ตามตำแหน่ง ให้เรียงตาม ID ของตำแหน่งแทน
        dataSql += ` ORDER BY j.jobpos_id ${sortOrder} `;
    } else {
        // Fallback สำหรับฟิลด์อื่นๆ ที่อนุญาต
        const allowedFields = ['emp_startwork', 'emp_id'];
        if(allowedFields.includes(sortField)) {
            dataSql += ` ORDER BY e.${sortField} ${sortOrder} `;
        } else {
            dataSql += ` ORDER BY e.emp_name ASC `; // Default sort
        }
    }

    const offset = (page - 1) * limit;
    dataSql += ` LIMIT ? OFFSET ? `;
    const employees = await query(dataSql, [parseInt(limit), parseInt(offset)]);

    return {
      data: employees,
      meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
    };
  },

getById: async (id) => {
  const sql = `
    SELECT 
      e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel, 
      e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, 
      j.jobpos_name
    FROM employee e
    JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    WHERE e.emp_id = ?
  `;
  const results = await query(sql, [id]);
  
  // CHANGED: คืนค่าเป็น Array ทั้งหมดที่เจอ ไม่ใช่แค่ตัวแรก
  return results; 
},
  // เพิ่มพนักงานใหม่
  create: async (data) => {
        const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday } = data;
        const existingEmployee = await query('SELECT emp_id FROM employee WHERE emp_email = ? OR emp_username = ?', [emp_email, emp_username]);
        if (existingEmployee.length > 0) {
            throw new Error('Email หรือ Username นี้มีผู้ใช้งานแล้ว');
        }

        const insertSql = `
            INSERT INTO employee
            (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;
        const params = [emp_name, parseInt(jobpos_id), emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday];
        
        const result = await query(insertSql, params);
        const newEmployeeId = result.insertId;
        const [newEmployeeData] = await Employee.getById(newEmployeeId);
        return newEmployeeData;
    },

  // อัปเดตข้อมูลพนักงาน
  update: async (id, data) => {
    const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic } = data;
    const sql = `
      UPDATE employee
      SET emp_name = ?, jobpos_id = ?, emp_email = ?, emp_tel = ?, emp_address = ?, emp_pic = ?
      WHERE emp_id = ?
    `;
    const params = [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic, id];
    await query(sql, params);

    // REFACTORED: คืนค่าเป็นข้อมูลพนักงานที่เพิ่งอัปเดต
    return await Employee.getById(id);
  },

  // ลบพนักงาน (ไม่เปลี่ยนแปลง)
  delete: async (id) => {
    return await query('DELETE FROM employee WHERE emp_id = ?', [id]);
  },
  
  // REFACTORED: ค้นหาพนักงาน (เพิ่ม Pagination และเลือกฟิลด์)
 // backend/models/employeeModel.js

  // REFACTORED: ค้นหาพนักงาน (แก้ไข Typo jp -> j)
  searchEmployees: async (searchTerm, sortField, sortOrder, page = 1, limit = 10) => {
    const searchPattern = `%${searchTerm}%`;
    
    // Query เพื่อนับจำนวน
    const countSql = `
      SELECT COUNT(e.emp_id) as total
      FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id 
      WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?`;
      //                                          ^^^ แก้ไขจาก jp เป็น j

    const [totalResult] = await query(countSql, [searchPattern, searchPattern]);
    const totalItems = totalResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    // Query เพื่อดึงข้อมูล
    let dataSql = `
      SELECT ${SAFE_EMPLOYEE_FIELDS}
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?
    `;
    //                                  ^^^ แก้ไขจาก jp เป็น j

    // --- ส่วนของ ORDER BY (ถูกต้องแล้ว) ---
    if (sortField === 'emp_name') {
        dataSql += ` ORDER BY CAST(REGEXP_SUBSTR(e.emp_name, '[0-9]+') AS UNSIGNED) ${sortOrder}, e.emp_name ${sortOrder}`;
    } else if (sortField === 'jobpos_name') {
        dataSql += ` ORDER BY j.jobpos_id ${sortOrder} `;
    } else {
        const allowedFields = ['emp_startwork', 'emp_id'];
        if(allowedFields.includes(sortField)) {
            dataSql += ` ORDER BY e.${sortField} ${sortOrder} `;
        } else {
            dataSql += ` ORDER BY e.emp_name ASC `;
        }
    }
    // ------------------------------------

    const offset = (page - 1) * limit;
    dataSql += ` LIMIT ? OFFSET ? `;
    
    const employees = await query(dataSql, [searchPattern, searchPattern, parseInt(limit), parseInt(offset)]);

    return {
      data: employees,
      meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
    };
  },

  getByJobposId: async (jobposId) => {
  // ใช้ SAFE_EMPLOYEE_FIELDS เพื่อความปลอดภัยและประสิทธิภาพ
  const sql = `
    SELECT ${SAFE_EMPLOYEE_FIELDS}
    FROM employee e
    JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    WHERE e.jobpos_id = ?
  `;
  return await query(sql, [jobposId]);
},
};

module.exports = Employee;