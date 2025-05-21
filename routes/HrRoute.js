const express = require('express');
const router = express.Router();

router.get('/salary', (req, res) => {
    res.render('salary/index'); 
  });
router.get('/salary/edit', (req, res) => {
    res.render('salary/edit'); 
  });
  
router.get('/evaluation', (req, res) => {
    res.render('evaluation/index'); 
  });
router.get('/evaluation/form', (req, res) => {
    res.render('evaluation/evaluation'); 
  });
  
router.get('/apply-work', (req, res) => {
    res.render('apply-work/index'); 
  });
  
router.get('/apply-work/view', (req, res) => {
    res.render('apply-work/view'); 
  });
  



module.exports = router;
