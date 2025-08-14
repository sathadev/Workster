// backend/controllers/hrApplicantController.js
const JobApplicationModel = require('../models/jobApplicationModel');

exports.listMyApplicants = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { page = 1, pageSize = 10, q, status, jobPostingId } = req.query;

    const data = await JobApplicationModel.listByCompany({
      companyId,
      page,
      pageSize,
      q: q ? String(q).trim() : undefined,
      status: status ? String(status).trim() : undefined,
      jobPostingId,
    });

    return res.json(data);
  } catch (err) {
    console.error('listMyApplicants error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

exports.getMyApplicantDetail = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;

    const data = await JobApplicationModel.getDetailByCompany({ applicationId, companyId });
    if (!data) return res.status(404).json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });

    return res.json(data);
  } catch (err) {
    console.error('getMyApplicantDetail error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

exports.updateMyApplicantStatus = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;
    const { status } = req.body;

    const updated = await JobApplicationModel.updateStatusByCompany({
      applicationId: Number(applicationId),
      companyId,
      status,
    });

    return res.json({ message: 'อัปเดตสถานะสำเร็จ', application: updated });
  } catch (err) {
    console.error('updateMyApplicantStatus error:', err);
    if (err.code === 'NO_STATUS_COLUMN') {
      return res.status(400).json({ message: 'ไม่พบคอลัมน์ application_status ในตาราง job_applications' });
    }
    if (err.code === 'BAD_STATUS') {
      return res.status(400).json({ message: 'ค่าสถานะไม่ถูกต้อง (ต้องเป็น pending/reviewed/rejected/hired)' });
    }
    if (err.code === 'NOT_FOUND') {
      return res.status(404).json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });
    }
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
