const SalaryModel = require('../models/salaryModel');

exports.index = function(req, res) {
  SalaryModel.getAllSalaryInfo((err, results) => {
    if (err) {
      console.error('DB error:', err);
      return res.status(500).render('salary/index', { 
        employees: [], 
        error: 'เกิดข้อผิดพลาดในระบบฐานข้อมูล' 
      });
    }
    
    console.log('Results from DB:', results);
    
    // Ensure results is always an array
    const employees = Array.isArray(results) ? results : [];
    
    res.render('salary/index', { 
      employees: employees,
      searchTerm: undefined,
      error: null
    });
  });
};

// Add search functionality
exports.search = function(req, res) {
  const searchTerm = req.query.search || '';
  
  if (!searchTerm.trim()) {
    return res.redirect('/salary');
  }
  
  SalaryModel.searchSalaryInfo(searchTerm, (err, results) => {
    if (err) {
      console.error('Search error:', err);
      return res.status(500).render('salary/index', { 
        employees: [], 
        searchTerm: searchTerm,
        error: 'เกิดข้อผิดพลาดในการค้นหา' 
      });
    }
    
    const employees = Array.isArray(results) ? results : [];
    
    res.render('salary/index', { 
      employees: employees,
      searchTerm: searchTerm,
      error: null
    });
  });
};

exports.edit = function(req, res) {
  const empId = req.params.id;

  SalaryModel.getSalaryByEmpId(empId, (err, result) => {
    if (err) {
      console.error('Fetch salary error:', err);
      return res.status(500).send('เกิดข้อผิดพลาด');
    }

    if (!result) {
      return res.status(404).send('ไม่พบข้อมูลพนักงาน');
    }

    res.render('salary/edit', { employee: result });
  });
};

exports.update = function(req, res) {
  const empId = req.params.id;
  const { salary_base, salary_allowance, salary_bonus, salary_ot, salary_deduction } = req.body;

  SalaryModel.updateSalary(empId, { salary_base, salary_allowance, salary_bonus, salary_ot, salary_deduction }, (err) => {
    if (err) {
      console.error('Update salary error:', err);
      return res.status(500).send('อัพเดทข้อมูลไม่สำเร็จ');
    }
    res.redirect('/salary');
  });
};

