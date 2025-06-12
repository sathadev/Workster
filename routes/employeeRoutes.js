const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeController');
const multer = require('multer');
const upload = multer();

router.get('/employee', controller.list);
router.get('/employee/add', controller.addForm);
router.post('/employee/add', upload.single('emp_pic'), controller.createHandler);
router.get('/employee/view/:id', controller.view);
router.get('/employee/edit/:id', controller.editForm);
router.get('/profile', controller.viewProfile);
router.post('/employee/edit/:id', upload.single('emp_pic'), controller.update);
router.post('/employee/delete/:id', controller.delete);
// router.get('/employee/search', controller.searchEmployees);

module.exports = router;
