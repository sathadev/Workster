const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

// parse body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// session middleware ต้องมาก่อน routes
app.use(session({
  secret: 'secretKey12345',
  resave: false,
  saveUninitialized: true
}));

// view engine และ static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// routes
const authRoute = require('./routes/authRoute');
const indexRoute = require('./routes/indexRoute');

const EmpRoute = require('./routes/employeeRoutes');
const HrRoute = require('./routes/HrRoute');
const PosRoute = require('./routes/position');

// ใช้ routes
app.use('/', indexRoute,EmpRoute,HrRoute,PosRoute); 
app.use('/', authRoute);


app.listen(3000, () => {
  console.log('Server started at http://localhost:3000');
});
