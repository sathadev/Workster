// backend/routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');
const { protect } = require('../middleware/authMiddleware');

// ทุก Route ต้อง protect เพราะเป็นข้อมูลละเอียดอ่อน

// ดึงประวัติการประเมินทั้งหมด (สำหรับ Admin/HR)
router.get('/', protect, evaluationController.getAllEvaluations);

// ดึงการประเมินชิ้นเดียวด้วย ID
router.get('/:id', protect, evaluationController.getEvaluationById);

// บันทึกผลการประเมินใหม่
router.post('/', protect, evaluationController.createEvaluation);

// ดึงผลประเมินพร้อมข้อมูลพนักงาน
router.get('/result/:id', protect, evaluationController.getEvaluationResultById);

module.exports = router;