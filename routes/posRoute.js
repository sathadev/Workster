const express = require('express');
const router = express.Router();

router.get('/position', (req, res) => {
    res.render('position/index'); 
  });

  module.exports = router;
