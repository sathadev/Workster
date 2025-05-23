const express = require('express');
const router = express.Router();

router.get('/leave-work', (req, res) => {
  res.render('leavework/index'); 
});

router.get('/request', (req, res) => {
  res.render('leavework/request'); 
});

module.exports = router;
