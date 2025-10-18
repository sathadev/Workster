// backend/models/jobInterviewModel.js
// โมเดลสำหรับจัดการข้อมูล "การนัดสัมภาษณ์ผู้สมัครงาน"
// ใช้เชื่อมต่อกับฐานข้อมูลผ่าน query() จาก utils/db

const query = require('../utils/db');

// ชื่อของตารางในฐานข้อมูล
const APP = 'job_applications';   // ตารางใบสมัคร
const POST = 'job_postings';      // ตารางประกาศงาน
const INT = 'job_interviews';     // ตารางบันทึกการสัมภาษณ์

// ตรวจสอบสิทธิ์ของบริษัทว่ามีสิทธิเข้าถึงใบสมัครนี้หรือไม่
// ใช้ตรวจสอบก่อนทุกการ query ที่เกี่ยวกับการสัมภาษณ์
async function isOwnedByCompany(applicationId, companyId) {
  const rows = await query(
    `
    SELECT 1
    FROM ${APP} ja
    INNER JOIN ${POST} jp ON jp.job_posting_id = ja.job_posting_id
    WHERE ja.application_id = ? AND jp.company_id = ?
    LIMIT 1
    `,
    [applicationId, companyId]
  );
  // ถ้ามีผลลัพธ์อย่างน้อย 1 แถว แสดงว่าใบสมัครนี้เป็นของบริษัทนั้นจริง
  return rows.length > 0;
}

// ดึงรายการนัดสัมภาษณ์ของใบสมัครหนึ่งรายการ
// ใช้ใน hrInterviewController.listInterviews()
async function listByApplication({ applicationId, companyId }) {
  // ตรวจสอบสิทธิ์ก่อน
  const ok = await isOwnedByCompany(applicationId, companyId);
  if (!ok) return null; // ถ้าไม่ใช่ของบริษัทนี้ ให้ส่งค่า null กลับ

  // ดึงข้อมูลการนัดสัมภาษณ์ทั้งหมดของใบสมัครนี้
  const rows = await query(
    `
    SELECT interview_id, application_id, scheduled_at, method, location_or_link, notes, created_at
    FROM ${INT}
    WHERE application_id = ?
    ORDER BY scheduled_at DESC, interview_id DESC
    `,
    [applicationId]
  );
  return rows; // คืนค่ารายการนัดทั้งหมด
}

// เพิ่มการนัดสัมภาษณ์ใหม่สำหรับบริษัทหนึ่ง
// ใช้ใน hrInterviewController.scheduleInterview()
async function createForCompany({ applicationId, companyId, scheduled_at, method, location_or_link, notes }) {
  // ตรวจสอบสิทธิ์ก่อนเพิ่มข้อมูล
  const ok = await isOwnedByCompany(applicationId, companyId);
  if (!ok) return null; // ถ้าไม่ใช่ของบริษัทนี้ ไม่อนุญาตให้เพิ่มข้อมูล

  // บันทึกข้อมูลการนัดสัมภาษณ์ใหม่
  const result = await query(
    `
    INSERT INTO ${INT} (application_id, scheduled_at, method, location_or_link, notes)
    VALUES (?, ?, ?, ?, ?)
    `,
    [applicationId, scheduled_at, method, location_or_link || null, notes || null]
  );

  // ดึงข้อมูลที่เพิ่งบันทึกกลับมาเพื่อส่งให้ controller
  const rows = await query(`SELECT * FROM ${INT} WHERE interview_id = ?`, [result.insertId]);
  return rows[0]; // คืนข้อมูลแถวเดียวที่เพิ่งถูกเพิ่ม
}

// ส่งออกฟังก์ชันที่ใช้ภายนอก
module.exports = {
  listByApplication,
  createForCompany
};
