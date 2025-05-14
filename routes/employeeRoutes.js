const express = require('express');
const router = express.Router();
const controller = require('../controllers/employeeController');
const multer = require('multer');
const upload = multer();

// กำหนดเส้นทางสำหรับการแก้ไขข้อมูลพนักงาน
router.get('/employee', controller.list);
router.get('/employee/add', controller.addForm);
router.post('/employee/add', upload.single('emp_pic'), controller.createHandler);
router.get('/employee/view/:id', controller.view);
router.get('/employee/edit/:id', controller.editForm);

// ใช้ middleware upload.single('emp_pic') สำหรับการอัปเดตข้อมูล
router.post('/employee/edit/:id', upload.single('emp_pic'), controller.update);

router.post('/employee/delete/:id', controller.delete);

module.exports = router;
