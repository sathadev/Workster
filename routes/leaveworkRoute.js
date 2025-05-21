const express = require('express');
const router = express.Router();

router.get('/leave-work', (req, res) => {
  res.render('leavework/index'); 
});

module.exports = router;
