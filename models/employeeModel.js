const db = require('../config/db');  // เชื่อมต่อกับฐานข้อมูล

const Employee = {
  // ดึงข้อมูลพนักงานทั้งหมด
   getAllEvaluations: (callback) => {
    const sql = `
      SELECT e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
      FROM evaluatework e
      JOIN employee emp ON e.emp_id = emp.emp_id
      ORDER BY e.create_at DESC
    `;

    db.query(sql, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  },
  getAll: (callback) => {
    const query = `
      SELECT e.*, j.jobpos_name 
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    `;
    db.query(query, callback);
  },

  // ดึงข้อมูลพนักงานตาม id
  getById: (id, callback) => {
    const query = `
      SELECT e.*, j.jobpos_name 
      FROM employee e
      JOIN jobpos j ON e.jobpos_id = j.jobpos_id
      WHERE e.emp_id = ?
    `;
    db.query(query, [id], callback);
  },

  // ดึงพนักงานตามตำแหน่ง
  getByJobposId: (jobposId, callback) => {
    const query = `
      SELECT * FROM employee 
      WHERE jobpos_id = ?
    `;
    db.query(query, [jobposId], callback);
  },

  // เพิ่มพนักงานใหม่
  create: (data, callback) => {
  const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday } = data;

  // ตรวจสอบว่าอีเมลมีอยู่แล้วในระบบหรือไม่
  db.query('SELECT * FROM employee WHERE emp_email = ?', [emp_email], (err, results) => {
    if (err) return callback(err);
    if (results.length > 0) return callback(new Error('Email is already registered.'));

    // ถ้าอีเมลไม่ซ้ำ ก็ทำการเพิ่มข้อมูลพนักงานใหม่
    const query = `
      INSERT INTO employee 
      (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    db.query(query, [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday], callback);
  });
},

  // อัปเดตข้อมูลพนักงาน
  update: (id, data, callback) => {
    const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic } = data;
    const query = `
      UPDATE employee 
      SET emp_name = ?, jobpos_id = ?, emp_email = ?, emp_tel = ?, emp_address = ?, emp_pic = ? 
      WHERE emp_id = ?
    `;
    db.query(query, [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic, id], callback);
  },

  // ลบพนักงาน
  delete: (id, callback) => {
    db.query('DELETE FROM employee WHERE emp_id = ?', [id], callback);
  },

  getByJobposName: (jobposName, callback) => {
  const query = `
    SELECT e.* FROM employee e
    JOIN jobpos j ON e.jobpos_id = j.jobpos_id
    WHERE j.jobpos_name = ?
  `;
  db.query(query, [jobposName], callback);
},

};

module.exports = Employee;
