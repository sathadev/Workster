// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',      // ใส่รหัสผ่าน MySQL ของคุณ
  database: 'mydb'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err);
  } else {
    console.log('✅ Connected to MySQL database');
  }
});

module.exports = connection;
