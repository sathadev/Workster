const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');

// แสดงฟอร์มแก้ไขข้อมูล about
router.get('/about', aboutController.getAboutPage);

// อัพเดตข้อมูล about
router.post('/about/update', aboutController.updateAbout);

module.exports = router;
