const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index'); // render ไฟล์ EJS ที่ชื่อ index.ejs
});

module.exports = router;
