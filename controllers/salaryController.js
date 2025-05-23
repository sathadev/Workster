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