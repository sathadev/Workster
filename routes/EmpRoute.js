const express = require('express');
const router = express.Router();

router.get('/employee', (req, res) => {
  res.render('employee/index'); 
});

router.get('/employee/view', (req, res) => {
  res.render('employee/view'); 
});

router.get('/employee/edit', (req, res) => {
  res.render('employee/edit'); 
});

router.get('/employee/add', (req, res) => {
  res.render('employee/add'); 
});




module.exports = router;
