const SalaryModel = require('../models/salaryModel');

/**
 * แสดงรายการเงินเดือนทั้งหมด และรองรับการค้นหา
 */
exports.index = async (req, res) => {
  const searchTerm = req.query.search || '';

  try {
    let employees;
    if (searchTerm.trim()) {
      // หากมีคำค้นหา ให้เรียกใช้ฟังก์ชันค้นหา
      employees = await SalaryModel.searchSalaryInfo(searchTerm.trim());
    } else {
      // หากไม่มี ให้ดึงข้อมูลทั้งหมด
      employees = await SalaryModel.getAllSalaryInfo();
    }

    res.render('salary/index', {
      employees: Array.isArray(employees) ? employees : [],
      searchTerm: searchTerm,
      error: null
    });

  } catch (err) {
    console.error('DB error:', err);
    res.status(500).render('salary/index', {
      employees: [],
      searchTerm: searchTerm,
      error: 'เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน'
    });
  }
};

/**
 * แสดงฟอร์มแก้ไขข้อมูลเงินเดือน
 */
exports.edit = async (req, res) => {
  try {
    const empId = req.params.id;
    const employee = await SalaryModel.getSalaryByEmpId(empId);

    if (!employee) {
      return res.status(404).send('ไม่พบข้อมูลพนักงาน');
    }

    res.render('salary/edit', { employee });
  } catch (err) {
    console.error('Fetch salary error:', err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};

/**
 * อัปเดตข้อมูลเงินเดือน
 */
exports.update = async (req, res) => {
  try {
    const empId = req.params.id;
    const salaryData = req.body; // รับข้อมูลทั้งหมดจาก body

    await SalaryModel.updateSalary(empId, salaryData);
    res.redirect('/salary');
  } catch (err) {
    console.error('Update salary error:', err);
    res.status(500).send('อัปเดตข้อมูลไม่สำเร็จ');
  }
};

/**
 * ดูข้อมูลเงินเดือนของตนเอง
 */
exports.viewSelfSalary = async (req, res) => {
  // สมมติว่า emp_id ถูกเก็บใน session หลังจาก login
  const empId = req.session.user?.emp_id;

  if (!empId) {
    return res.status(401).send('กรุณาเข้าสู่ระบบเพื่อดูข้อมูล');
  }

  try {
    const employee = await SalaryModel.getSalaryByEmpId(empId);

    if (!employee) {
      return res.status(404).send('ไม่พบข้อมูลเงินเดือนของคุณ');
    }

    res.render('salary/view', { employee });
  } catch (err) {
    console.error('Fetch self salary error:', err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};