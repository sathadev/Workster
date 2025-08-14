// backend/utils/mailer.js
// ปลอดภัย: ไม่พังแม้ยังไม่ได้ติดตั้ง nodemailer / ยังไม่ได้ตั้ง SMTP

// โหลด .env ถ้ามี (ไม่มีก็ไม่เป็นไร)
try { require('dotenv').config(); } catch {}

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch {
  // ไม่มี nodemailer ก็ปล่อยให้เป็น null -> จะใช้ fallback ด้านล่าง
}

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
} = process.env;

let transporter;

// เงื่อนไข 1: มี nodemailer และตั้งค่า SMTP พร้อม -> ส่งเมลจริง
if (nodemailer && (SMTP_HOST || SMTP_USER)) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE) === 'true', // true = 465
    auth: (SMTP_USER && SMTP_PASS) ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}
// เงื่อนไข 2: มี nodemailer แต่ยังไม่ตั้ง SMTP -> แสดงอีเมลเป็น JSON ใน console (dev)
else if (nodemailer) {
  transporter = nodemailer.createTransport({ jsonTransport: true });
  console.warn('[mailer] Using jsonTransport (dev). Set SMTP_* env to send real emails.');
}
// เงื่อนไข 3: ไม่มี nodemailer -> fallback ไม่พังแอป (log อย่างเดียว)
else {
  transporter = {
    async sendMail(msg) {
      console.warn('✉️ [DEV mailer fallback] nodemailer not installed.');
      console.warn('→ Would send mail:', {
        to: msg.to,
        subject: msg.subject,
        from: msg.from,
        hasHtml: !!msg.html,
        hasText: !!msg.text,
      });
      return { messageId: `dev-${Date.now()}`, accepted: [msg.to], rejected: [] };
    },
  };
}

async function sendMail({ to, subject, html, text }) {
  const from = MAIL_FROM || SMTP_USER || 'no-reply@example.com';
  return transporter.sendMail({ from, to, subject, html, text });
}

module.exports = { transporter, sendMail };
