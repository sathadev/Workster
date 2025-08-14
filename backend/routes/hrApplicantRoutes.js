// backend/routes/hrApplicantRoutes.js
const express = require('express');
const router = express.Router();
const hrApplicantController = require('../controllers/hrApplicantController');

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

// List
router.get('/', hrApplicantController.listMyApplicants);

// Detail
router.get('/:applicationId', hrApplicantController.getMyApplicantDetail);

// Update status
router.patch('/:applicationId/status', hrApplicantController.updateMyApplicantStatus);

module.exports = router;
