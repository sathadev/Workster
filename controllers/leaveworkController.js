const LeaveworkModel = require('../models/leaveworkModel');

exports.index = (req, res) => {
  LeaveworkModel.getAllLeaveRequests((err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('เกิดข้อผิดพลาด');
    }
    res.render('leavework/index', { leaveworks: results });
  });
};

// Original requestForm (this one is duplicated later, consider removing it)
// exports.requestForm = (req, res) => {
//   res.render('leavework/request');
// };

exports.create = (req, res) => {
  const emp_id = req.session.user?.emp_id;
  if (!emp_id) {
    return res.redirect('/login');
  }

  const data = {
    datestart: req.body.datestart,
    dateend: req.body.dateend,
    description: req.body.description,
    emp_id: emp_id, // ใช้ session ตรงๆ
    leaveworktype_id: req.body.leaveworktype_id
  };

  LeaveworkModel.createLeaveRequest(data, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('บันทึกไม่สำเร็จ');
    }
    res.redirect('/request');
  });
};

exports.approve = (req, res) => {
  const id = req.params.id;
  LeaveworkModel.updateLeaveStatus(id, 'approved', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('อัปเดตไม่สำเร็จ');
    }
    res.redirect('/leave-work');
  });
};

exports.reject = (req, res) => {
  const id = req.params.id;
  LeaveworkModel.updateLeaveStatus(id, 'rejected', (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('อัปเดตไม่สำเร็จ');
    }
    res.redirect('/leave-work');
  });
};

// Corrected and updated requestForm to fetch both employee's leaves and all leave types
exports.requestForm = (req, res) => {
  const emp_id = req.session.user?.emp_id;

  if (!emp_id) {
    return res.redirect('/login'); // ถ้ายังไม่ได้ login
  }

  // Use Promise.all to fetch both data simultaneously
  Promise.all([
    new Promise((resolve, reject) => {
      LeaveworkModel.getLeaveByEmpId(emp_id, (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      LeaveworkModel.getAllLeaveTypes((err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    })
  ])
  .then(([leaveworks, leaveTypes]) => {
    res.render('leavework/request', {
      leaveworks: leaveworks,
      emp_id: emp_id,
      leaveTypes: leaveTypes // Pass leave types to the template
    });
  })
  .catch((err) => {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาด');
  });
};