// backend/utils/mailer.js
// ยูทิลิตี้สำหรับส่งอีเมลแบบปลอดภัย: ไม่พังแม้ยังไม่ได้ติดตั้ง nodemailer หรือยังไม่ได้ตั้งค่า SMTP

// โหลดค่าจาก .env (ถ้าไม่มีไฟล์ .env จะไม่เกิด error)
try {
  require('dotenv').config();
} catch {}

// พยายามโหลด nodemailer ถ้ายังไม่ได้ติดตั้งจะไม่ throw error
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  // ถ้าไม่มี nodemailer จะถูกจัดการใน fallback ด้านล่าง
}

// ดึงค่าตัวแปรสิ่งแวดล้อมจาก .env
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

let transporter;

// เงื่อนไข 1: มี nodemailer และตั้งค่า SMTP ครบ → ใช้โหมดส่งเมลจริง
if (nodemailer && (SMTP_HOST || SMTP_USER)) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE) === 'true', // ถ้า true จะใช้พอร์ต 465
    auth:
      SMTP_USER && SMTP_PASS
        ? { user: SMTP_USER, pass: SMTP_PASS }
        : undefined,
  });
}
// เงื่อนไข 2: ติดตั้ง nodemailer แล้ว แต่ยังไม่ตั้งค่า SMTP → ใช้ jsonTransport (แสดงอีเมลใน console)
else if (nodemailer) {
  transporter = nodemailer.createTransport({ jsonTransport: true });
  console.warn(
    '[mailer] Using jsonTransport (dev). Set SMTP_* environment variables to send real emails.'
  );
}
// เงื่อนไข 3: ยังไม่มี nodemailer → ใช้ fallback ที่ไม่พังระบบ (แค่ log รายละเอียดใน console)
else {
  transporter = {
    async sendMail(msg) {
      console.warn('[DEV mailer fallback] nodemailer not installed.');
      console.warn('→ Simulated email:', {
        to: msg.to,
        subject: msg.subject,
        from: msg.from,
        hasHtml: !!msg.html,
        hasText: !!msg.text,
      });
      return {
        messageId: `dev-${Date.now()}`,
        accepted: [msg.to],
        rejected: [],
      };
    },
  };
}

// ฟังก์ชันหลักสำหรับส่งอีเมล (ทั้งโหมดจริงและจำลอง)
async function sendMail({ to, subject, html, text }) {
  const from = MAIL_FROM || SMTP_USER || 'no-reply@example.com';
  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { transporter, sendMail };
