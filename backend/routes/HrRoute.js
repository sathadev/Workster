const express = require('express');
const router = express.Router();

router.get('/salary/edit', (req, res) => {
    res.render('salary/edit'); 
  });
  
router.get('/apply-work', (req, res) => {
    res.render('apply-work/index'); 
  });
  
router.get('/apply-work/view', (req, res) => {
    res.render('apply-work/view'); 
  });
  



module.exports = router;
