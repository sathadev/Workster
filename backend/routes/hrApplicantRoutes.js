// backend/routes/hrApplicantRoutes.js
// ใช้ protect แทน requireCompanyAuth (ไม่ต้องมี middleware แยก)

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const hrApplicantController = require('../controllers/hrApplicantController');
const hrInterviewController = require('../controllers/hrInterviewController');
const hrDecisionController = require('../controllers/hrDecisionController');

// ใช้ protect เพื่อดึง company_id และข้อมูลผู้ใช้จาก JWT
router.use(protect);

// [GET] /api/v1/hr/applicants - ดึงรายการใบสมัครทั้งหมดของบริษัท
router.get('/', hrApplicantController.listMyApplicants);

// [GET] /api/v1/hr/applicants/:applicationId - ดึงรายละเอียดใบสมัครรายบุคคล
router.get('/:applicationId', hrApplicantController.getMyApplicantDetail);

// [PATCH] /api/v1/hr/applicants/:applicationId/status - อัปเดตสถานะใบสมัคร
router.patch('/:applicationId/status', hrApplicantController.updateMyApplicantStatus);

// [GET] /api/v1/hr/applicants/:applicationId/interviews - ดึงรายการนัดสัมภาษณ์ทั้งหมด
router.get('/:applicationId/interviews', hrInterviewController.listInterviews);

// [POST] /api/v1/hr/applicants/:applicationId/interviews - สร้างการนัดสัมภาษณ์ใหม่
router.post('/:applicationId/interviews', hrInterviewController.scheduleInterview);

// [PATCH] /api/v1/hr/applicants/:applicationId/decision - ส่งผลการพิจารณา (ผ่าน/ไม่ผ่าน)
router.patch('/:applicationId/decision', hrDecisionController.sendDecision);

module.exports = router;
