const util = require('util');
const db = require('../config/db'); // เชื่อมต่อกับฐานข้อมูล

// ทำให้ db.query ใช้กับ async/await ได้
// .bind(db) เป็นสิ่งสำคัญเพื่อให้ 'this' context ถูกต้อง
const query = util.promisify(db.query).bind(db);

const Employee = {
  // ดึงข้อมูลการประเมินทั้งหมด
  getAllEvaluations: async () => {
    const sql = `
      SELECT e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
      FROM evaluatework e
      JOIN employee emp ON e.emp_id = emp.emp_id
      ORDER BY e.create_at DESC
    `;
    return await query(sql);
  },

  // ดึงข้อมูลพนักงานทั้งหมด (เวอร์ชันเก่าที่ใช้ sort แบบเฉพาะ)
  getAll: async (sort) => {
    let sql = `
      SELECT e.*, j.jobpos_name
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    `;
    
    // Logic การเรียงลำดับยังคงเดิม
    if (sort === 'jobpos_id_asc') sql += ` ORDER BY e.jobpos_id ASC`;
    else if (sort === 'jobpos_id_desc') sql += ` ORDER BY e.jobpos_id DESC`;
    else if (sort === 'name_asc') sql += ` ORDER BY e.emp_name ASC`;
    else if (sort === 'name_desc') sql += ` ORDER BY e.emp_name DESC`;
    else if (sort === 'jobpos_asc') sql += ` ORDER BY j.jobpos_name ASC`;
    else if (sort === 'jobpos_desc') sql += ` ORDER BY j.jobpos_name DESC`;
    else sql += ` ORDER BY e.emp_name ASC`; // Default sort

    return await query(sql);
  },

  // ดึงข้อมูลพนักงานทั้งหมดพร้อมเรียงลำดับ (เวอร์ชันที่ปรับปรุงแล้ว)
  getAllSorted: async (sortField, sortOrder) => {
    const allowedFields = ['emp_name', 'jobpos_name', 'jobpos_id', 'emp_startwork', 'emp_id'];
    if (!allowedFields.includes(sortField)) sortField = 'emp_name';

    let sql = `
      SELECT e.*, j.jobpos_name, j.jobpos_id
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    `;
    
    // Logic การเรียงลำดับยังคงเดิม
    if (sortField === 'emp_name') {
      sql += `
        ORDER BY
          CASE WHEN e.emp_name REGEXP '[0-9]+' THEN
            CAST(SUBSTRING(e.emp_name, REGEXP_INSTR(e.emp_name, '[0-9]+'), LENGTH(REGEXP_SUBSTR(e.emp_name, '[0-9]+'))) AS UNSIGNED)
          ELSE NULL
          END ${sortOrder},
          e.emp_name ${sortOrder}
      `;
    } else if (sortField === 'jobpos_name' || sortField === 'jobpos_id') {
      sql += ` ORDER BY j.jobpos_id ${sortOrder} `;
    } else {
      sql += ` ORDER BY e.${sortField} ${sortOrder} `;
    }

    return await query(sql);
  },

  // ดึงข้อมูลพนักงานตาม id
  getById: async (id) => {
    const sql = `
      SELECT e.*, j.jobpos_name
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_id = ?
    `;
    return await query(sql, [id]);
  },

  // ดึงพนักงานตามตำแหน่ง
  getByJobposId: async (jobposId) => {
    const sql = `SELECT * FROM employee WHERE jobpos_id = ?`;
    return await query(sql, [jobposId]);
  },

  // เพิ่มพนักงานใหม่
  create: async (data) => {
    const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday } = data;

    // 1. ตรวจสอบว่าอีเมลมีอยู่แล้วในระบบหรือไม่
    const existingEmployee = await query('SELECT emp_id FROM employee WHERE emp_email = ?', [emp_email]);
    if (existingEmployee.length > 0) {
      // ถ้ามี ให้โยน Error ออกไปเพื่อให้ try...catch ใน Controller จัดการ
      throw new Error('Email is already registered.');
    }

    // 2. ถ้าอีเมลไม่ซ้ำ ก็ทำการเพิ่มข้อมูลพนักงานใหม่
    const insertSql = `
      INSERT INTO employee
      (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    const params = [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday];
    return await query(insertSql, params);
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
    return await query(sql, params);
  },

  // ลบพนักงาน
  delete: async (id) => {
    return await query('DELETE FROM employee WHERE emp_id = ?', [id]);
  },

  // ดึงพนักงานตามชื่อตำแหน่ง
  getByJobposName: async (jobposName) => {
    const sql = `
      SELECT e.* FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE j.jobpos_name = ?
    `;
    return await query(sql, [jobposName]);
  },

  // ค้นหาพนักงาน
  searchEmployees: async (searchTerm) => {
    const sql = `
      SELECT e.*, j.jobpos_name
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?
      ORDER BY e.emp_name ASC
    `;
    const searchPattern = `%${searchTerm}%`;
    return await query(sql, [searchPattern, searchPattern]);
  },
};

module.exports = Employee;