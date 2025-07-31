// backend/utils/db.js
const util = require('util');
const db = require('../config/db'); // Path ไปยังไฟล์เชื่อมต่อ DB ของคุณ

// ทำให้ db.query ใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

module.exports = query;