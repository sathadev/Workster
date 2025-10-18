// backend/controllers/hrDecisionController.js
// Controller สำหรับให้ HR ส่งผลการพิจารณาใบสมัคร (ผ่าน / ไม่ผ่าน)
// พร้อมอัปเดตสถานะใบสมัครและส่งอีเมลแจ้งผู้สมัคร

const { sendMail } = require('../utils/mailer');
const JobApplicationModel = require('../models/jobApplicationModel');
const query = require('../utils/db');

// [POST] /api/v1/hr/decisions/:applicationId
// ส่งผลการพิจารณาใบสมัคร (hired หรือ rejected)
// เมื่อส่งผลแล้ว ระบบจะอัปเดตสถานะในฐานข้อมูลและส่งอีเมลแจ้งผู้สมัคร
exports.sendDecision = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;
    const { decision, note } = req.body; // ค่า decision ต้องเป็น 'hired' หรือ 'rejected'

    // ตรวจสอบค่าที่ส่งมา ว่าถูกต้องหรือไม่
    if (!['hired', 'rejected'].includes(String(decision))) {
      return res.status(400).json({ message: 'decision ต้องเป็น hired หรือ rejected' });
    }

    // ตรวจสอบว่าใบสมัครนี้ถูกปิดการดำเนินการ (finalized) แล้วหรือไม่
    const finalized = await JobApplicationModel.isFinalized({
      applicationId: Number(applicationId),
      companyId,
    });

    if (finalized === null) {
      return res
        .status(404)
        .json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });
    }
    if (finalized) {
      return res
        .status(409)
        .json({ message: 'ใบสมัครนี้ถูกปิดการดำเนินการแล้ว ไม่สามารถส่งผลซ้ำได้' });
    }

    // ดึงข้อมูลรายละเอียดใบสมัคร เพื่อใช้งานในขั้นตอนต่อไป
    const app = await JobApplicationModel.getDetailByCompany({
      applicationId: Number(applicationId),
      companyId,
    });

    // อัปเดตสถานะใบสมัครในตารางหลัก (ถ้ามีคอลัมน์ application_status)
    try {
      await JobApplicationModel.updateStatusByCompany({
        applicationId: Number(applicationId),
        companyId,
        status: decision === 'hired' ? 'hired' : 'rejected',
      });
    } catch (e) {
      // หากไม่มีคอลัมน์ application_status ให้บันทึกสถานะในตาราง flags แทน
      if (e.code !== 'NO_STATUS_COLUMN') throw e;
      await query(
        `
        INSERT INTO job_application_flags (application_id, is_finalized, decision, decision_at)
        VALUES (?, 1, ?, NOW())
        ON DUPLICATE KEY UPDATE
          is_finalized = VALUES(is_finalized),
          decision     = VALUES(decision),
          decision_at  = VALUES(decision_at)
        `,
        [Number(applicationId), decision]
      );
    }

    // เตรียมข้อมูลอีเมลแจ้งผลผู้สมัคร
    const pass = decision === 'hired';
    const subject = pass
      ? `ผลการพิจารณา: ผ่านสำหรับตำแหน่ง ${app.job_title || 'ตำแหน่งงาน'}`
      : `ผลการพิจารณา: ไม่ผ่านสำหรับตำแหน่ง ${app.job_title || 'ตำแหน่งงาน'}`;

    const html = pass
      ? `
        <p>เรียนคุณ ${app.applicant_name || ''},</p>
        <p>ยินดีด้วย คุณผ่านการพิจารณาสำหรับตำแหน่ง <strong>${app.job_title || `#${app.job_posting_id}`}</strong></p>
        ${note ? `<p><strong>หมายเหตุจาก HR:</strong> ${note}</p>` : ''}
        <p>โปรดตอบกลับเพื่อยืนยันการรับข้อเสนอหรือขั้นตอนถัดไป</p>
      `
      : `
        <p>เรียนคุณ ${app.applicant_name || ''},</p>
        <p>ขอบคุณที่ให้ความสนใจ ในรอบนี้คุณ<strong>ยังไม่ผ่าน</strong>สำหรับตำแหน่ง <strong>${app.job_title || `#${app.job_posting_id}`}</strong></p>
        ${note ? `<p><strong>หมายเหตุจาก HR:</strong> ${note}</p>` : ''}
        <p>หวังว่าจะได้พิจารณาอีกในโอกาสหน้า</p>
      `;

    // ส่งอีเมลผลการพิจารณาไปยังผู้สมัคร
    await sendMail({
      to: app.applicant_email,
      subject,
      html,
      text: subject,
    });

    // ตอบกลับผลลัพธ์เมื่อทุกอย่างสำเร็จ
    res.status(200).json({
      message: 'ส่งอีเมลผลการพิจารณาแล้ว และปิดการดำเนินการของใบสมัครนี้',
    });
  } catch (e) {
    console.error('sendDecision error:', e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
