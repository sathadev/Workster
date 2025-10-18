// backend/utils/db.js
// Utility สำหรับทำให้คำสั่ง db.query() สามารถใช้งานร่วมกับ async/await ได้

const util = require('util');
const db = require('../config/db'); // เรียกการเชื่อมต่อฐานข้อมูลจากไฟล์ config/db.js

// แปลงฟังก์ชัน db.query() ที่ใช้ callback ให้กลายเป็น Promise
// เพื่อให้สามารถใช้ await query('SQL...') ได้โดยตรงใน controller
const query = util.promisify(db.query).bind(db);

// ส่งออกฟังก์ชัน query() ให้ไฟล์อื่นสามารถนำไปใช้งานได้
module.exports = query;
