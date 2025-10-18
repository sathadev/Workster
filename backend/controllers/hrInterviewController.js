// backend/controllers/hrInterviewController.js
// Controller สำหรับให้ HR จัดการ "การนัดสัมภาษณ์ผู้สมัครงาน"
// ฟังก์ชันหลัก:
// 1. listInterviews — แสดงรายการนัดสัมภาษณ์ของใบสมัคร
// 2. scheduleInterview — สร้างนัดสัมภาษณ์ใหม่และส่งอีเมลแจ้งผู้สมัคร

const { sendMail } = require('../utils/mailer'); // ใช้สำหรับส่งอีเมลแจ้งผู้สมัคร
const JobApplicationModel = require('../models/jobApplicationModel'); // จัดการข้อมูลใบสมัคร
const JobInterviewModel = require('../models/jobInterviewModel'); // จัดการข้อมูลการสัมภาษณ์

// ฟังก์ชันแปลงวันที่เป็นรูปแบบภาษาไทย (โซนเวลา Bangkok)
// ใช้เพื่อให้เวลาที่แสดงในอีเมลมีความเข้าใจง่ายต่อผู้สมัคร
function formatThai(dtStr) {
  const d = new Date(dtStr);
  return d.toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// [GET] /api/v1/hr/interviews/:applicationId
// ดึงรายการการนัดสัมภาษณ์ของใบสมัครที่ระบุ
exports.listInterviews = async (req, res) => {
  try {
    const companyId = req.companyId;           // companyId ของ HR ที่ล็อกอิน
    const { applicationId } = req.params;      // รหัสใบสมัครจาก URL

    // ดึงข้อมูลการนัดสัมภาษณ์ทั้งหมดของใบสมัครในบริษัทนี้
    const items = await JobInterviewModel.listByApplication({
      applicationId: Number(applicationId),
      companyId
    });

    // ถ้าไม่พบใบสมัครหรือไม่ใช่ของบริษัทนี้ ให้ตอบกลับ 404
    if (items === null) {
      return res.status(404).json({
        message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ'
      });
    }

    // ส่งรายการสัมภาษณ์กลับในรูปแบบ JSON
    res.status(200).json({ items });
  } catch (e) {
    console.error('listInterviews error:', e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// [POST] /api/v1/hr/interviews/:applicationId
// ใช้สำหรับสร้างนัดสัมภาษณ์ใหม่ของผู้สมัคร
exports.scheduleInterview = async (req, res) => {
  try {
    const companyId = req.companyId;           // รหัสบริษัทของ HR
    const { applicationId } = req.params;      // รหัสใบสมัครจาก URL
    const { scheduled_at, method = 'online', location_or_link, notes } = req.body;

    // ตรวจสอบว่ากรอกวันเวลานัดสัมภาษณ์หรือไม่
    if (!scheduled_at) {
      return res.status(400).json({
        message: 'กรุณาระบุวันเวลา (scheduled_at)'
      });
    }

    // ตรวจสอบสถานะใบสมัคร ถ้า finalized แล้วจะไม่อนุญาตให้นัดอีก
    const finalized = await JobApplicationModel.isFinalized({
      applicationId: Number(applicationId),
      companyId
    });

    if (finalized === null) {
      return res.status(404).json({
        message: 'ไม่พบใบสมัคร หรือไม่ได้เป็นของบริษัทคุณ'
      });
    }
    if (finalized) {
      return res.status(400).json({
        message: 'ใบสมัครนี้ถูกปิดการดำเนินการแล้ว ไม่สามารถนัดสัมภาษณ์ได้'
      });
    }

    // ดึงข้อมูลผู้สมัครและตำแหน่งงานเพื่อใช้ประกอบในอีเมล
    const app = await JobApplicationModel.getDetailByCompany({
      applicationId: Number(applicationId),
      companyId
    });

    // บันทึกการนัดสัมภาษณ์ใหม่ในฐานข้อมูล
    const interview = await JobInterviewModel.createForCompany({
      applicationId: Number(applicationId),
      companyId,
      scheduled_at,
      method,
      location_or_link,
      notes
    });

    // แปลงวันเวลานัดสัมภาษณ์ให้อยู่ในรูปแบบไทย
    const when = formatThai(scheduled_at);

    // สร้างหัวข้อและเนื้อหาอีเมลสำหรับแจ้งผู้สมัคร
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

    // ส่งอีเมลนัดสัมภาษณ์ไปยังผู้สมัคร
    await sendMail({ to: app.applicant_email, subject, html, text: subject });

    // ส่งผลลัพธ์กลับเมื่อบันทึกและส่งเมลสำเร็จ
    res.status(201).json({
      message: 'บันทึกและส่งอีเมลนัดสัมภาษณ์แล้ว',
      interview
    });
  } catch (e) {
    console.error('scheduleInterview error:', e);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
