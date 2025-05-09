const express = require('express');
const path = require('path');
const app = express();

// ใช้ EJS เป็น view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ใช้ static ไฟล์จาก public เช่น CSS, รูป
app.use(express.static('public'));

// นำเข้า route
const indexRoute = require('./routes/indexRoute');
const EmpRoute = require('./routes/EmpRoute');
const HrRoute = require('./routes/HrRoute');

// ใช้ routes
app.use('/', indexRoute,EmpRoute,HrRoute); 

app.listen(3000, () => {
  console.log('Server started at http://localhost:3000');
});
