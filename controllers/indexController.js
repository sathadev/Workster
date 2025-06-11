const Attendance = require('../models/attendanceModel');

exports.showHome = (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const emp_id = req.session.user.emp_id;
  const now = new Date();

  Attendance.getWorkTime((err, config) => {
    if (err) return res.status(500).send("เกิดข้อผิดพลาด");

    const endwork = new Date(now.toDateString() + ' ' + config.endwork);
    const isAfterEndWork = now >= endwork;

    Attendance.getTodayAttendance(emp_id, (err, records) => {
      if (err) return res.status(500).send("เกิดข้อผิดพลาด");

      const checkin = records.find(r => r.attendance_type === 'checkin');
      const checkout = records.find(r => r.attendance_type === 'checkout');

      const formatTime = (datetime) => {
        return new Date(datetime).toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Bangkok'
        });
      };

      // Nest the calls to ensure data is available before rendering
      Attendance.getTodayCheckinCount((err, checkinCount) => {
        if (err) return res.status(500).send("เกิดข้อผิดพลาด");

        Attendance.getTodaySummary((err, summary) => {
          if (err) return res.status(500).send("เกิดข้อผิดพลาดขณะโหลดสรุป");

          res.render('index', {
            user: req.session.user,
            checkinTime: checkin ? formatTime(checkin.attendance_datetime) : null,
            checkoutTime: checkout ? formatTime(checkout.attendance_datetime) : null,
            isAfterEndWork,
            checkinCount,
            ontimeCount: summary.ontime,
            lateCount: summary.late,
            absentCount: summary.absent
          });
        });
      });
    });
  });
};


exports.handleCheckIn = (req, res) => {
  const emp_id = req.session.user.emp_id;

  Attendance.checkIn(emp_id, (err) => {
    if (err) {
      console.error(err);
      return res.redirect('/?error=already_checked_in');
    }
    res.redirect('/');
  });
};


exports.handleCheckOut = (req, res) => {
  const emp_id = req.session.user.emp_id;

  Attendance.getTodayAttendance(emp_id, (err, records) => {
    if (err) return res.status(500).send("เกิดข้อผิดพลาด");

    const hasCheckedIn = records.some(r => r.attendance_type === 'checkin');
    const hasCheckedOut = records.some(r => r.attendance_type === 'checkout');

    if (!hasCheckedIn) {
      return res.status(400).send("คุณต้องเช็คอินก่อน");
    }

    if (hasCheckedOut) {
      return res.status(400).send("คุณได้เช็คเอ้าท์แล้ววันนี้");
    }

    const now = new Date();
    Attendance.getWorkTime((err, config) => {
      if (err) return res.status(500).send("ไม่สามารถดึงเวลาเลิกงานได้");

      const endwork = new Date(now.toDateString() + ' ' + config.endwork);

      // ถ้าออกก่อนเวลา ให้ใส่ status 'early' แทน 'ontime'
      const status = now < endwork ? 'early' : 'ontime';

      Attendance.checkOut(emp_id, status, (err) => {
        if (err) return res.status(500).send("เช็คเอ้าท์ไม่สำเร็จ");
        res.redirect('/');
      });
    });
  });
};
