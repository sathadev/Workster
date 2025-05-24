const express = require('express');
const router = express.Router();
const leaveworkController = require('../controllers/leaveworkController');

router.get('/leave-work', leaveworkController.index);  // <<< ใช้ controller ตรงนี้

router.get('/request', leaveworkController.requestForm);
router.post('/request', leaveworkController.create);

router.get('/leave-work/approve/:id', leaveworkController.approve);
router.get('/leave-work/reject/:id', leaveworkController.reject);

module.exports = router;
