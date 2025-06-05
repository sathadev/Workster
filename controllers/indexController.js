const Attendance = require('../models/attendanceModel');

exports.showHome = (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const emp_id = req.session.user.emp_id;

  Attendance.getTodayAttendance(emp_id, (err, records) => {
    if (err) return res.status(500).send("เกิดข้อผิดพลาด");

    const checkin = records.find(r => r.attendance_type === 'checkin');
    const checkout = records.find(r => r.attendance_type === 'checkout');

    res.render('index', {
      user: req.session.user,
      checkinTime: checkin ? checkin.attendance_datetime.toLocaleTimeString() : null,
      checkoutTime: checkout ? checkout.attendance_datetime.toLocaleTimeString() : null
    });
  });
};


exports.handleCheckIn = (req, res) => {
  const emp_id = req.session.user.emp_id;
  Attendance.checkIn(emp_id, (err) => {
    if (err) return res.status(500).send("เช็คอินไม่สำเร็จ");
    res.redirect('/');
  });
};

exports.handleCheckOut = (req, res) => {
  const emp_id = req.session.user.emp_id;
  Attendance.checkOut(emp_id, (err) => {
    if (err) return res.status(500).send("เช็คเอ้าท์ไม่สำเร็จ");
    res.redirect('/');
  });
};
