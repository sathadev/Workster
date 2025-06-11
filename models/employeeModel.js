const db = require('../config/db'); // เชื่อมต่อกับฐานข้อมูล

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
getAll: (sort, callback) => { // Accept sort parameter
  let query = `
    SELECT e.*, j.jobpos_name
    FROM employee e
    JOIN jobpos j ON e.jobpos_id = j.jobpos_id
  `;

  // Add ORDER BY clause based on the sort parameter
  if (sort === 'jobpos_id_asc') {
    query += ` ORDER BY e.jobpos_id ASC`;
  } else if (sort === 'jobpos_id_desc') {
    query += ` ORDER BY e.jobpos_id DESC`;
  } else if (sort === 'name_asc') {
    query += ` ORDER BY e.emp_name ASC`;
  } else if (sort === 'name_desc') {
    query += ` ORDER BY e.emp_name DESC`;
  } else if (sort === 'jobpos_asc') {
    query += ` ORDER BY j.jobpos_name ASC`;
  } else if (sort === 'jobpos_desc') {
    query += ` ORDER BY j.jobpos_name DESC`;
  } else {
    query += ` ORDER BY e.emp_name ASC`; // Default sort
  }

  db.query(query, callback);
},

getAllSorted: (sortField, sortOrder, callback) => {
  const allowedFields = ['emp_name', 'jobpos_name', 'emp_startwork', 'jobpos_id']; // เพิ่ม jobpos_id

  if (!allowedFields.includes(sortField)) sortField = 'emp_name';

  let query = `
    SELECT e.*, j.jobpos_name
    FROM employee e
    JOIN jobpos j ON e.jobpos_id = j.jobpos_id
  `;

  if (sortField === 'emp_name') {
    query += `
      ORDER BY
        CASE WHEN e.emp_name REGEXP '[0-9]+' THEN
          CAST(
            SUBSTRING(
              e.emp_name,
              REGEXP_INSTR(e.emp_name, '[0-9]+'),
              LENGTH(REGEXP_SUBSTR(e.emp_name, '[0-9]+'))
            ) AS UNSIGNED
          )
        ELSE NULL
        END ${sortOrder},
        e.emp_name ${sortOrder}
    `;
  } else {
    query += ` ORDER BY e.${sortField} ${sortOrder} `; // เปลี่ยนจาก ${sortField} เป็น e.${sortField} เพราะ jobpos_id อยู่ใน employee table
  }

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
  getAllSorted: (sortField, sortOrder, callback) => {
  const allowedFields = ['emp_name', 'jobpos_name', 'emp_startwork', 'emp_id']; // เพิ่ม emp_id

  if (!allowedFields.includes(sortField)) sortField = 'emp_name';

  let query = `
    SELECT e.*, j.jobpos_name
    FROM employee e
    JOIN jobpos j ON e.jobpos_id = j.jobpos_id
  `;

  // กรณีเรียงตามชื่อ (emp_name) โดยต้องแยกกรณีชื่อที่มีตัวเลขกับไม่มีตัวเลข
  if (sortField === 'emp_name') {
    query += `
      ORDER BY
        CASE WHEN e.emp_name REGEXP '[0-9]+' THEN
          CAST(
            SUBSTRING(
              e.emp_name,
              REGEXP_INSTR(e.emp_name, '[0-9]+'),
              LENGTH(REGEXP_SUBSTR(e.emp_name, '[0-9]+'))
            ) AS UNSIGNED
          )
        ELSE NULL
        END ${sortOrder},
        e.emp_name ${sortOrder}
    `;
  } else {
    // กรณีอื่น ๆ ใช้เรียงตามปกติ
    query += ` ORDER BY ${sortField} ${sortOrder} `;
  }

  db.query(query, callback);
},

};

module.exports = Employee;