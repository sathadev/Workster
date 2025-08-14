// backend/routes/hrApplicantRoutes.js
const express = require('express');
const router = express.Router();
const hrApplicantController = require('../controllers/hrApplicantController');
const hrInterviewController = require('../controllers/hrInterviewController');
const hrDecisionController = require('../controllers/hrDecisionController');

// Inline middleware: require company
const requireCompanyAuth = (req, res, next) => {
  try {
    const raw = (req.user && req.user.company_id) || req.headers['x-company-id'];
    const companyId = Number(raw);
    if (!raw || Number.isNaN(companyId) || companyId <= 0) {
      return res.status(401).json({ message: 'ต้องมี company_id (ผ่าน JWT หรือ X-Company-Id header ระหว่าง dev)' });
    }
    req.companyId = companyId;
    next();
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

router.use(requireCompanyAuth);

// List + Detail + Update status (เดิม)
router.get('/', hrApplicantController.listMyApplicants);
router.get('/:applicationId', hrApplicantController.getMyApplicantDetail);
router.patch('/:applicationId/status', hrApplicantController.updateMyApplicantStatus);

// Interviews
router.get('/:applicationId/interviews', hrInterviewController.listInterviews);
router.post('/:applicationId/interviews', hrInterviewController.scheduleInterview);

// Decision (result email)
router.patch('/:applicationId/decision', hrDecisionController.sendDecision);

module.exports = router;
