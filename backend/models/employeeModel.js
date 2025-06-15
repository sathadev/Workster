const util = require('util');
const db = require('../config/db');

// ทำให้ db.query ใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

// REFACTORED: กำหนดฟิลด์ที่ปลอดภัยสำหรับดึงข้อมูล เพื่อหลีกเลี่ยงการส่งข้อมูลรหัสผ่าน
const SAFE_EMPLOYEE_FIELDS = `
  e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel, 
  e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, 
  j.jobpos_name
`;

const Employee = {
  // ดึงข้อมูลการประเมินทั้งหมด (ไม่เปลี่ยนแปลง)
  getAllEvaluations: async () => {
    const sql = `
      SELECT e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
      FROM evaluatework e
      JOIN employee emp ON e.emp_id = emp.emp_id
      ORDER BY e.create_at DESC
    `;
    return await query(sql);
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
    const allowedFields = ['emp_name', 'jobpos_name', 'emp_startwork', 'emp_id'];
    if (!allowedFields.includes(sortField)) sortField = 'emp_name';
    
    // 1. Query เพื่อนับจำนวนรายการทั้งหมดสำหรับทำ Pagination
    const countSql = `SELECT COUNT(emp_id) as total FROM employee`;
    const [totalResult] = await query(countSql);
    const totalItems = totalResult.total;
    const totalPages = Math.ceil(totalItems / limit);
    
    // 2. Query เพื่อดึงข้อมูลตามหน้าและจำนวนที่กำหนด
    let dataSql = `
      SELECT ${SAFE_EMPLOYEE_FIELDS}
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      ORDER BY e.${sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const offset = (page - 1) * limit;
    const employees = await query(dataSql, [parseInt(limit), parseInt(offset)]);

    // 3. คืนค่าเป็น Object ที่มีทั้งข้อมูลและ meta สำหรับ Frontend
    return {
      data: employees,
      meta: {
        totalItems,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    };
  },

  // REFACTORED: ดึงข้อมูลพนักงานตาม id โดยเลือกฟิลด์ที่ปลอดภัย
  getById: async (id) => {
    const sql = `
      SELECT ${SAFE_EMPLOYEE_FIELDS}
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_id = ?
    `;
    // คืนค่าเฉพาะ object ตัวแรก เพราะ id ควรจะมีแค่คนเดียว
    const results = await query(sql, [id]);
    return results[0]; 
  },

  // เพิ่มพนักงานใหม่
  create: async (data) => {
    const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday } = data;

    const existingEmployee = await query('SELECT emp_id FROM employee WHERE emp_email = ?', [emp_email]);
    if (existingEmployee.length > 0) {
      throw new Error('Email is already registered.');
    }

    const insertSql = `
      INSERT INTO employee
      (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday];
    
    const result = await query(insertSql, params);
    
    // REFACTORED: คืนค่าเป็นข้อมูลพนักงานที่เพิ่งสร้าง แทนที่จะเป็น OkPacket
    const newEmployeeId = result.insertId;
    return await Employee.getById(newEmployeeId);
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
  searchEmployees: async (searchTerm, page = 1, limit = 10) => {
    const searchPattern = `%${searchTerm}%`;
    const countSql = `
      SELECT COUNT(e.emp_id) as total
      FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?`;
    
    const [totalResult] = await query(countSql, [searchPattern, searchPattern]);
    const totalItems = totalResult.total;
    const totalPages = Math.ceil(totalItems / limit);

    const dataSql = `
      SELECT ${SAFE_EMPLOYEE_FIELDS}
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?
      ORDER BY e.emp_name ASC
      LIMIT ? OFFSET ?
    `;
    const offset = (page - 1) * limit;
    const employees = await query(dataSql, [searchPattern, searchPattern, parseInt(limit), parseInt(offset)]);

    return {
      data: employees,
      meta: {
        totalItems,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
      },
    };
  },
};

module.exports = Employee;