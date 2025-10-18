// backend/controllers/hrApplicantController.js
// Controller สำหรับ HR ใช้จัดการใบสมัครของผู้สมัครในบริษัทตนเอง
// ครอบคลุมการดูรายชื่อผู้สมัคร ดูรายละเอียด และอัปเดตสถานะใบสมัคร

const JobApplicationModel = require('../models/jobApplicationModel');

// [GET] /api/v1/hr/applicants
// ดึงรายการใบสมัครทั้งหมดของบริษัท พร้อมตัวกรอง (Search / Status / Job Posting)
exports.listMyApplicants = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { page = 1, pageSize = 10, q, status, jobPostingId } = req.query;

    // ดึงข้อมูลจาก Model โดยส่งเงื่อนไขการค้นหาและแบ่งหน้า
    const data = await JobApplicationModel.listByCompany({
      companyId,
      page,
      pageSize,
      q: q ? String(q).trim() : undefined,
      status: status ? String(status).trim() : undefined,
      jobPostingId,
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('listMyApplicants error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// [GET] /api/v1/hr/applicants/:applicationId
// ดึงรายละเอียดใบสมัครของผู้สมัครรายบุคคลในบริษัท
exports.getMyApplicantDetail = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;

    // ดึงรายละเอียดใบสมัครจาก Model
    const data = await JobApplicationModel.getDetailByCompany({ applicationId, companyId });

    // ตรวจสอบว่าพบข้อมูลหรือไม่
    if (!data) {
      return res
        .status(404)
        .json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('getMyApplicantDetail error:', err);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// [PUT] /api/v1/hr/applicants/:applicationId/status
// อัปเดตสถานะใบสมัคร เช่น pending → reviewed → rejected → hired
exports.updateMyApplicantStatus = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;
    const { status } = req.body;

    // เรียกใช้ Model เพื่ออัปเดตสถานะใบสมัคร
    const updated = await JobApplicationModel.updateStatusByCompany({
      applicationId: Number(applicationId),
      companyId,
      status,
    });

    return res.status(200).json({
      message: 'อัปเดตสถานะสำเร็จ',
      application: updated,
    });
  } catch (err) {
    console.error('updateMyApplicantStatus error:', err);

    // ตรวจจับ error code ที่อาจเกิดขึ้นจาก Model
    if (err.code === 'NO_STATUS_COLUMN') {
      return res
        .status(400)
        .json({ message: 'ไม่พบคอลัมน์ application_status ในตาราง job_applications' });
    }
    if (err.code === 'BAD_STATUS') {
      return res
        .status(400)
        .json({ message: 'ค่าสถานะไม่ถูกต้อง (ต้องเป็น pending/reviewed/rejected/hired)' });
    }
    if (err.code === 'NOT_FOUND') {
      return res
        .status(404)
        .json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });
    }

    return res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
