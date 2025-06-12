const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

router.get('/salary', salaryController.index);
// router.get('/salary/search', salaryController.search);

router.get('/salary/edit/:id', salaryController.edit);
router.post('/salary/update/:id', salaryController.update);

router.get('/salary/me', salaryController.viewSelfSalary);


module.exports = router;