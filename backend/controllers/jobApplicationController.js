// backend/controllers/jobApplicationController.js
// Controller สำหรับจัดการใบสมัครงาน (Job Applications)
// ครอบคลุมการส่งใบสมัครใหม่และอัปเดตสถานะใบสมัครของบริษัท

const fs = require('fs').promises;
const Joi = require('joi');

const JobPostingModel = require('../models/jobPostingModel');
const JobApplicationModel = require('../models/jobApplicationModel');

// Schema สำหรับตรวจสอบข้อมูลผู้สมัคร (ใช้กับ multipart/form-data)
const applicationSchema = Joi.object({
  applicant_name: Joi.string().required(),
  applicant_email: Joi.string().email().required(),
  applicant_phone: Joi.string().allow('', null),
  other_links_text: Joi.string().allow('', null),
  cover_letter_text: Joi.string().allow('', null),
  expected_salary: Joi.alternatives(
    Joi.number(),
    Joi.string().regex(/^\d+(\.\d+)?$/)
  ).allow('', null),
  available_start_date: Joi.string().allow('', null),
  // ฟิลด์สำหรับยืนยันการยอมรับนโยบายความเป็นส่วนตัว
  consent_privacy: Joi.any()
    .custom((v, h) => {
      const truthy = ['true', '1', 'on', 1, true, 'yes'];
      if (!truthy.includes(v)) return h.error('any.invalid');
      return v;
    })
    .messages({ 'any.invalid': 'กรุณายอมรับนโยบายความเป็นส่วนตัว' }),
});

// [POST] /api/v1/job-applications/:jobPostingId
// ฟังก์ชันสร้างใบสมัครใหม่ โดยตรวจสอบความถูกต้องของข้อมูลและไฟล์แนบ
exports.createJobApplication = async (req, res) => {
  try {
    const { jobPostingId } = req.params;
    const postingIdNum = Number(jobPostingId);

    // ตรวจสอบว่ามีรหัสประกาศงานและต้องเป็นตัวเลขบวก
    if (!postingIdNum || Number.isNaN(postingIdNum) || postingIdNum <= 0) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'รหัสประกาศงานไม่ถูกต้อง' });
    }

    // ตรวจสอบข้อมูลจากฟอร์ม (body)
    const { error } = applicationSchema.validate(req.body);
    if (error) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res
        .status(400)
        .json({ message: error.details?.[0]?.message || 'ข้อมูลไม่ถูกต้อง' });
    }

    // ตรวจสอบว่ามีไฟล์เรซูเม่แนบมาหรือไม่
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาแนบไฟล์ Resume/CV' });
    }

    // ตรวจสอบว่าประกาศงานนั้นมีอยู่จริง
    const jobPosting = await JobPostingModel.getJobPostingById(postingIdNum, null);
    if (!jobPosting) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานนี้' });
    }

    // ตรวจสอบสถานะของประกาศงานแบบยืดหยุ่น (ไม่บังคับว่าต้องมีทุกคอลัมน์)
    const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
    if (has(jobPosting, 'job_status') && jobPosting.job_status !== 'active') {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'ประกาศงานนี้ยังไม่เปิดรับสมัคร' });
    }
    if (has(jobPosting, 'company_status') && jobPosting.company_status !== 'approved') {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'บริษัทนี้ยังไม่ได้รับการอนุมัติ' });
    }
    if (has(jobPosting, 'is_active') && String(jobPosting.is_active) !== '1') {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'ประกาศงานนี้ปิดรับสมัครแล้ว' });
    }

    // กำหนด path ของไฟล์เรซูเม่ที่จะถูกเก็บในฝั่ง client
    const resumeRelativePath = `/uploads/resumes/${req.file.filename}`;

    // แปลงค่าการยอมรับนโยบายให้เป็น boolean
    const consent =
      req.body.consent_privacy === true ||
      req.body.consent_privacy === 'true' ||
      req.body.consent_privacy === '1' ||
      req.body.consent_privacy === 1 ||
      req.body.consent_privacy === 'on' ||
      req.body.consent_privacy === 'yes';

    // แปลง expected_salary ให้เป็นตัวเลข (ถ้าไม่กรอกให้เป็น null)
    const salaryRaw = req.body.expected_salary;
    const expectedSalary =
      salaryRaw !== undefined && salaryRaw !== null && String(salaryRaw).trim() !== ''
        ? Number(salaryRaw)
        : null;

    // สร้าง object สำหรับบันทึกลงฐานข้อมูล
    const applicationData = {
      job_posting_id: postingIdNum,
      applicant_name: String(req.body.applicant_name || '').trim(),
      applicant_email: String(req.body.applicant_email || '').trim().toLowerCase(),
      applicant_phone: req.body.applicant_phone || null,
      resume_filepath: resumeRelativePath,
      other_links_text: req.body.other_links_text || null,
      cover_letter_text: req.body.cover_letter_text || null,
      expected_salary: expectedSalary,
      available_start_date:
        req.body.available_start_date && String(req.body.available_start_date).trim() !== ''
          ? String(req.body.available_start_date).trim()
          : null,
      consent_privacy: !!consent,
      application_status: 'pending',
    };

    // บันทึกข้อมูลใบสมัครลงฐานข้อมูล
    const newApplication = await JobApplicationModel.create(applicationData);

    // ตอบกลับผลลัพธ์
    return res.status(201).json({
      message: 'ส่งใบสมัครสำเร็จแล้ว',
      application: newApplication,
    });
  } catch (err) {
    console.error('Error submitting job application:', err);

    // ลบไฟล์ที่อัปโหลดแล้วหากเกิดข้อผิดพลาด
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// [PUT] /api/v1/job-applications/:applicationId/status
// ฟังก์ชันอัปเดตสถานะใบสมัคร เช่น pending → reviewed → hired
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const companyId = req.user.company_id; // ใช้ company_id จาก token ที่ผ่านการยืนยันแล้ว

    // อัปเดตสถานะใบสมัครผ่าน Model
    const updated = await JobApplicationModel.updateStatusByCompany({
      applicationId,
      companyId,
      status,
    });

    // ตอบกลับเมื่ออัปเดตสำเร็จ
    return res.status(200).json({
      message: 'อัปเดตสถานะเรียบร้อยแล้ว',
      application: updated,
    });
  } catch (err) {
    console.error('Update application status error:', err);

    // ตรวจจับ error code จาก Model เพื่อส่งข้อความที่เข้าใจง่าย
    switch (err.code) {
      case 'ALREADY_FINALIZED':
        return res
          .status(400)
          .json({ message: 'ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากใบสมัครถูก Finalized แล้ว' });
      case 'BAD_STATUS':
        return res
          .status(400)
          .json({ message: 'สถานะที่ส่งมาไม่ถูกต้อง (ต้องเป็น pending/reviewed/rejected/hired)' });
      case 'NOT_FOUND':
        return res
          .status(404)
          .json({ message: 'ไม่พบใบสมัครนี้ หรือไม่ใช่ของบริษัทคุณ' });
      case 'NO_STATUS_COLUMN':
        return res
          .status(500)
          .json({ message: 'ฐานข้อมูลไม่มีคอลัมน์ application_status' });
      default:
        return res
          .status(500)
          .json({ message: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
  }
};
