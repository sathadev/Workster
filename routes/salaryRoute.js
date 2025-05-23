const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/salary', salaryController.index);
router.get('/salary/search', salaryController.search);

module.exports = router;