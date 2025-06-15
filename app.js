const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// parse body
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// session middleware ต้องมาก่อน routes
app.use(session({
  secret: 'mySecretKey123',  // ตั้งค่าเป็น string อะไรก็ได้
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 60 * 60 * 1000 }  // อยู่ได้ 1 ชั่วโมง
}));

// view engine และ static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// routes
const authRoute = require('./routes/authRoute');
const indexRoute = require('./routes/indexRoute');

const EmpRoute = require('./routes/employeeRoutes');
const HrRoute = require('./routes/HrRoute');
const PosRoute = require('./routes/posRoute');
const leaveworkRoute = require('./routes/leaveworkRoute');
const salaryRoutes = require('./routes/salaryRoute');
const evaluationRoute = require('./routes/evaluationRoute');
const aboutRoutes = require('./routes/aboutRoute');



// ใช้ routes
app.use('/', indexRoute);
app.use('/', EmpRoute);
app.use('/', HrRoute);
app.use('/', PosRoute);
app.use('/', authRoute);
app.use('/', salaryRoutes);
app.use('/', leaveworkRoute);
app.use('/', evaluationRoute);
app.use('/', aboutRoutes);


app.listen(3000, () => {
  console.log('Server started at http://localhost:3000');
});
