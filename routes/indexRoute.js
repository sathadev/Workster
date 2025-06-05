const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/', indexController.showHome);          // ✅ ใช้ controller ที่จัดการ checkinTime
router.post('/checkin', indexController.handleCheckIn);
router.post('/checkout', indexController.handleCheckOut);

module.exports = router;
