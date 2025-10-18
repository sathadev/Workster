// backend/routes/evaluationRoutes.js
// Route สำหรับจัดการข้อมูลการประเมินผลพนักงาน (Employee Evaluation)

const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { protect } = require('../middleware/authMiddleware');

// [GET] /api/v1/evaluations
// ดึงข้อมูลการประเมินทั้งหมด (เฉพาะ HR/Admin)
router.get('/', protect, evaluationController.getAllEvaluations);

// [GET] /api/v1/evaluations/:id
// ดึงข้อมูลการประเมินเฉพาะรายการด้วย ID
router.get('/:id', protect, evaluationController.getEvaluationById);

// [POST] /api/v1/evaluations
// เพิ่มข้อมูลผลการประเมินใหม่ (เฉพาะ HR/Admin)
router.post('/', protect, evaluationController.createEvaluation);

// [GET] /api/v1/evaluations/result/:id
// ดึงผลการประเมินพร้อมข้อมูลพนักงาน
router.get('/result/:id', protect, evaluationController.getEvaluationResultById);

module.exports = router;
