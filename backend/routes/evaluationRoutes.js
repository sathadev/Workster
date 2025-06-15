// backend/routes/evaluationRoutes.js
const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

// GET /api/v1/evaluations -> ดึงประวัติการประเมินทั้งหมด
router.get('/', evaluationController.getAllEvaluations);

// POST /api/v1/evaluations -> สร้างการประเมินใหม่
router.post('/', evaluationController.createEvaluation);

// GET /api/v1/evaluations/:id -> ดึงการประเมินชิ้นเดียว
router.get('/:id', evaluationController.getEvaluationById);

module.exports = router;