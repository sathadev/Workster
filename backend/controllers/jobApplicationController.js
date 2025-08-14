// backend/controllers/jobApplicationController.js
const fs = require('fs').promises;
const Joi = require('joi');

const JobPostingModel = require('../models/jobPostingModel');
const JobApplicationModel = require('../models/jobApplicationModel');

// validate แบบยืดหยุ่นกับ multipart/form-data
const applicationSchema = Joi.object({
  applicant_name: Joi.string().required(),
  applicant_email: Joi.string().email().required(),
  applicant_phone: Joi.string().allow('', null),
  other_links_text: Joi.string().allow('', null),
  cover_letter_text: Joi.string().allow('', null),
  expected_salary: Joi.alternatives(
    Joi.number(),
    Joi.string().regex(/^\d+(\.\d+)?$/) // รับเป็นสตริงตัวเลขได้
  ).allow('', null),
  available_start_date: Joi.string().allow('', null),
  // ยอมรับค่าพวก 'true','1','on'
  consent_privacy: Joi.any()
    .custom((v, h) => {
      const truthy = ['true', '1', 'on', 1, true, 'yes'];
      if (!truthy.includes(v)) return h.error('any.invalid');
      return v;
    })
    .messages({ 'any.invalid': 'กรุณายอมรับนโยบายความเป็นส่วนตัว' }),
});

exports.createJobApplication = async (req, res) => {
  try {
    const { jobPostingId } = req.params;
    const postingIdNum = Number(jobPostingId);
    if (!postingIdNum || Number.isNaN(postingIdNum) || postingIdNum <= 0) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'รหัสประกาศงานไม่ถูกต้อง' });
    }

    // 1) validate body
    const { error } = applicationSchema.validate(req.body);
    if (error) {
      if (req.file) await fs.unlink(req.file.path).catch(() => {});
      return res
        .status(400)
        .json({ message: error.details?.[0]?.message || 'ข้อมูลไม่ถูกต้อง' });
    }

    // 2) ต้องมีไฟล์
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาแนบไฟล์ Resume/CV' });
    }

    // 3) เช็กประกาศงาน (ยืดหยุ่นตามสคีมา)
    const jobPosting = await JobPostingModel.getJobPostingById(postingIdNum, null);
    if (!jobPosting) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานนี้' });
    }

    // ตรวจสถานะแบบ "มีค่อยเช็ค" (ไม่มีคอลัมน์ก็ผ่าน)
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

    // 4) path สำหรับฝั่ง client (แก้ให้สะกด "uploads" ถูกต้อง)
    //    ตรงนี้สมมติว่า multer เซฟไฟล์ไว้ที่ <project>/backend/public/uploads/resumes/<filename>
    const resumeRelativePath = `/uploads/resumes/${req.file.filename}`;

    // 5) normalize fields
    const consent =
      req.body.consent_privacy === true ||
      req.body.consent_privacy === 'true' ||
      req.body.consent_privacy === '1' ||
      req.body.consent_privacy === 1 ||
      req.body.consent_privacy === 'on' ||
      req.body.consent_privacy === 'yes';

    const salaryRaw = req.body.expected_salary;
    const expectedSalary =
      salaryRaw !== undefined && salaryRaw !== null && String(salaryRaw).trim() !== ''
        ? Number(salaryRaw)
        : null;

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
      application_status: 'pending', // ถ้า DB ไม่มีคอลัมน์นี้ JobApplicationModel.create จะไม่ส่งลง INSERT
    };

    // 6) สร้างใบสมัคร
    const newApplication = await JobApplicationModel.create(applicationData);

    return res.status(201).json({
      message: 'ส่งใบสมัครสำเร็จแล้ว',
      application: newApplication,
    });
  } catch (err) {
    console.error('Error submitting job application:', err);
    // ลบไฟล์ทิ้งถ้าเกิด error
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
