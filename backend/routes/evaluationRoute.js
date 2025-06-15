const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluationController');

router.get('/evaluation', evaluationController.showEvaluationPage);       // หน้า index
router.get('/evaluation/form', evaluationController.showEvaluationForm);  // หน้า form
router.post('/evaluation/form/:id', evaluationController.saveEvaluation);
router.get('/evaluation/history', evaluationController.getEvaluationHistory);
router.get('/evaluation/result/:id', evaluationController.showEvaluationById);


module.exports = router;
