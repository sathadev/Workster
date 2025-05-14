const db = require('../config/db');  // เชื่อมต่อกับฐานข้อมูล

const Employee = {
  // ดึงข้อมูลพนักงานทั้งหมด
  getAll: (callback) => {
    db.query('SELECT * FROM employee', callback);
  },

  getById: (id, callback) => {
    db.query('SELECT * FROM employee WHERE emp_id = ?', [id], callback);
  },

  // เพิ่มพนักงานใหม่
  create: (data, callback) => {
    const { emp_name, emp_jobpos, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic } = data;

    // ตรวจสอบว่าอีเมลมีอยู่แล้วในระบบหรือไม่
    db.query('SELECT * FROM employee WHERE emp_email = ?', [emp_email], (err, results) => {
      if (err) {
        return callback(err);
      }
      if (results.length > 0) {
        return callback(new Error('Email is already registered.'));
      }

      // ถ้าอีเมลไม่ซ้ำ ก็ทำการเพิ่มข้อมูลพนักงานใหม่
      const query = `
        INSERT INTO employee (emp_name, emp_jobpos, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      db.query(query, [emp_name, emp_jobpos, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic], callback);
    });
  },

  // อัปเดตข้อมูลพนักงาน
  update: (id, data, callback) => {
    const { emp_name, emp_jobpos, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic } = data;
    const query = `
      UPDATE employee 
      SET emp_name = ?, emp_jobpos = ?, emp_email = ?, emp_tel = ?, emp_address = ?, emp_username = ?, emp_password = ?, emp_pic = ? 
      WHERE emp_id = ?`;
    db.query(query, [emp_name, emp_jobpos, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, id], callback);
  },

  // ลบพนักงาน
  delete: (id, callback) => {
    db.query('DELETE FROM employee WHERE emp_id = ?', [id], callback);
  }
};

module.exports = Employee;
