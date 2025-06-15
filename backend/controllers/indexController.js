const Attendance = require('../models/attendanceModel');

/**
 * Displays the main dashboard (homepage).
 * Fetches all necessary data concurrently for faster loading.
 */
exports.showHome = async (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  try {
    const { emp_id } = req.session.user;

    // Fetch all required data in parallel for better performance
    const [config, records, checkinCount, summary] = await Promise.all([
      Attendance.getWorkTime(),
      Attendance.getTodayAttendance(emp_id),
      Attendance.getTodayCheckinCount(),
      Attendance.getTodaySummary()
    ]);

    // Helper function to format time
    const formatTime = (datetime) => {
      if (!datetime) return null;
      return new Date(datetime).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Bangkok'
      });
    };

    const now = new Date();
    const endworkTime = new Date(`${now.toDateString()} ${config.endwork}`);
    const isAfterEndWork = now >= endworkTime;

    const checkin = records.find(r => r.attendance_type === 'checkin');
    const checkout = records.find(r => r.attendance_type === 'checkout');

    res.render('index', {
      user: req.session.user,
      checkinTime: formatTime(checkin?.attendance_datetime),
      checkoutTime: formatTime(checkout?.attendance_datetime),
      isAfterEndWork,
      checkinCount,
      ontimeCount: summary.ontime,
      lateCount: summary.late,
      absentCount: summary.absent,
    });
  } catch (err) {
    console.error("Error loading home page:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการโหลดข้อมูลหน้าหลัก");
  }
};

/**
 * Handles the check-in process for the logged-in user.
 */
exports.handleCheckIn = async (req, res) => {
  try {
    const { emp_id } = req.session.user;
    await Attendance.checkIn(emp_id);
    res.redirect('/');
  } catch (err) {
    console.error("Check-in error:", err);
    // Redirect with an error message, e.g., for duplicate check-ins
    res.redirect('/?error=check_in_failed');
  }
};

/**
 * Handles the check-out process for the logged-in user.
 */
exports.handleCheckOut = async (req, res) => {
  try {
    const { emp_id } = req.session.user;

    // 1. Get today's attendance records for validation
    const records = await Attendance.getTodayAttendance(emp_id);

    // 2. Validate check-in and check-out status
    const hasCheckedIn = records.some(r => r.attendance_type === 'checkin');
    const hasCheckedOut = records.some(r => r.attendance_type === 'checkout');

    if (!hasCheckedIn) {
      return res.status(400).send("คุณต้องเช็คอินก่อน");
    }
    if (hasCheckedOut) {
      return res.status(400).send("คุณได้เช็คเอาท์ไปแล้วสำหรับวันนี้");
    }

    // 3. Get work time configuration to determine status
    const config = await Attendance.getWorkTime();
    const now = new Date();
    const endworkTime = new Date(`${now.toDateString()} ${config.endwork}`);

    // 4. Determine check-out status
    const status = now < endworkTime ? 'early' : 'ontime';

    // 5. Perform the check-out
    await Attendance.checkOut(emp_id, status);
    res.redirect('/');
  } catch (err) {
    console.error("Check-out error:", err);
    res.status(500).send("เกิดข้อผิดพลาดระหว่างการเช็คเอาท์");
  }
};