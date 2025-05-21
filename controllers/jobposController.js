const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel');

exports.list = (req, res) => {
  Jobpos.getAll((err, results) => {
    if (err) throw err;
    res.render('position/index', { positions: results });
  });
};

exports.view = (req, res) => {
  const jobposId = req.params.id;

  Jobpos.getById(jobposId, (err, jobposResults) => {
    if (err) throw err;
    if (jobposResults.length === 0) {
      return res.status(404).send('ไม่พบตำแหน่งนี้');
    }

    const jobpos = jobposResults[0];

    Employee.getByJobposId(jobposId, (err, employeeResults) => {
      if (err) throw err;
      res.render('position/view', {
        jobpos,
        employees: employeeResults
      });
    });
  });
};
exports.add = (req, res) => {
  const { jobpos_name } = req.body;

  // เช็คว่าชื่อตำแหน่งไม่ว่าง
  if (!jobpos_name) {
    return res.redirect('/position');
  }

  Jobpos.create(jobpos_name, (err) => {
    if (err) {
      console.error(err);
      return res.redirect('/position');
    }
    res.redirect('/position');
  });
};