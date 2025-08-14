// backend/controllers/hrInterviewController.js
const { sendMail } = require('../utils/mailer');
const JobApplicationModel = require('../models/jobApplicationModel');
const JobInterviewModel = require('../models/jobInterviewModel');

function formatThai(dtStr) {
  const d = new Date(dtStr);
  return d.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

exports.listInterviews = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;
    const items = await JobInterviewModel.listByApplication({ applicationId: Number(applicationId), companyId });
    if (items === null) return res.status(404).json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });
    res.json({ items });
  } catch (e) {
    console.error('listInterviews error:', e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { applicationId } = req.params;
    const { scheduled_at, method = 'online', location_or_link, notes } = req.body;

    if (!scheduled_at) return res.status(400).json({ message: 'กรุณาระบุวันเวลา (scheduled_at)' });

    // ❗ บล็อกถ้า finalized แล้ว
    const finalized = await JobApplicationModel.isFinalized({ applicationId: Number(applicationId), companyId });
    if (finalized === null) return res.status(404).json({ message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ' });
    if (finalized) return res.status(400).json({ message: 'ใบสมัครนี้ถูกปิดการดำเนินการแล้ว ไม่สามารถนัดสัมภาษณ์ได้' });

    const app = await JobApplicationModel.getDetailByCompany({ applicationId: Number(applicationId), companyId });

    const interview = await JobInterviewModel.createForCompany({
      applicationId: Number(applicationId),
      companyId,
      scheduled_at, method, location_or_link, notes
    });

    const when = formatThai(scheduled_at);
    const subject = `นัดสัมภาษณ์งาน: ${app.job_title || 'ตำแหน่งงาน'} - ${when}`;
    const html = `
      <p>เรียนคุณ ${app.applicant_name || ''},</p>
      <p>ขอนัดสัมภาษณ์สำหรับตำแหน่ง <strong>${app.job_title || `#${app.job_posting_id}`}</strong></p>
      <ul>
        <li><strong>วันและเวลา:</strong> ${when} (เวลาไทย)</li>
        <li><strong>รูปแบบ:</strong> ${method}</li>
        <li><strong>สถานที่/ลิงก์:</strong> ${location_or_link || '-'}</li>
      </ul>
      ${notes ? `<p><strong>หมายเหตุ:</strong> ${notes}</p>` : ''}
      <p>โปรดตอบกลับอีเมลฉบับนี้หากต้องการเลื่อน/ยกเลิก</p>
    `;
    await sendMail({ to: app.applicant_email, subject, html, text: subject });

    res.status(201).json({ message: 'บันทึกและส่งอีเมลนัดสัมภาษณ์แล้ว', interview });
  } catch (e) {
    console.error('scheduleInterview error:', e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
