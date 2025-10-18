// backend/controllers/attendanceController.js
// Controller สำหรับจัดการการเช็กอิน เช็กเอาต์ และดึงข้อมูลการลงเวลาของพนักงาน

const Attendance = require('../models/attendanceModel');

// [GET] /api/v1/attendance/today
// ดึงข้อมูลการเช็กอินและเช็กเอาต์ของพนักงานที่เข้าสู่ระบบในวันปัจจุบัน
exports.getTodaysUserAttendance = async (req, res) => {
  try {
    const { emp_id } = req.user;

    // ดึงข้อมูลการลงเวลาและเวลาทำงานพร้อมกัน
    const [records, config] = await Promise.all([
      Attendance.getTodayAttendance(emp_id, req.companyId),
      Attendance.getWorkTime(req.companyId),
    ]);

    // ฟังก์ชันแปลงเวลาให้อยู่ในรูปแบบ HH:MM (Asia/Bangkok)
    const formatTime = (datetime) =>
      datetime
        ? new Date(datetime).toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Bangkok',
          })
        : null;

    // แยกข้อมูลเช็กอินและเช็กเอาต์
    const checkin = records.find((r) => r.attendance_type === 'checkin');
    const checkout = records.find((r) => r.attendance_type === 'checkout');

    // ตรวจสอบว่าปัจจุบันเลยเวลาเลิกงานหรือยัง
    const now = new Date();
    const endworkTime = new Date(`${now.toDateString()} ${config.endwork}`);
    const isAfterEndWork = now >= endworkTime;

    // ส่งข้อมูลให้ฝั่ง frontend แสดงผล
    res.status(200).json({
      checkinTime: formatTime(checkin?.attendance_datetime),
      checkoutTime: formatTime(checkout?.attendance_datetime),
      hasCheckedIn: !!checkin,
      hasCheckedOut: !!checkout,
      isAfterEndWork,
    });
  } catch (err) {
    console.error('API Error [getTodaysUserAttendance]:', err);
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลการลงเวลา' });
  }
};

// [POST] /api/v1/attendance/checkin
// ฟังก์ชันสำหรับเช็กอิน (บันทึกเวลาเข้างานของพนักงาน)
exports.handleCheckIn = async (req, res) => {
  try {
    const { emp_id } = req.user;

    // เรียก model เพื่อเช็กอิน
    await Attendance.checkIn(emp_id, req.companyId);

    res.status(201).json({ message: 'เช็คอินสำเร็จ' });
  } catch (err) {
    console.error('Check-in error:', err);
    res
      .status(400)
      .json({ message: err.message || 'เกิดข้อผิดพลาดในการเช็คอิน' });
  }
};

// [POST] /api/v1/attendance/checkout
// ฟังก์ชันสำหรับเช็กเอาต์ (พนักงานกดบันทึกเวลาออกงาน)
exports.handleCheckOut = async (req, res) => {
  try {
    const { emp_id } = req.user;

    // ดึงข้อมูลการลงเวลาของวันนี้
    const records = await Attendance.getTodayAttendance(emp_id, req.companyId);
    const hasCheckedIn = records.some((r) => r.attendance_type === 'checkin');
    const hasCheckedOut = records.some((r) => r.attendance_type === 'checkout');

    // ตรวจสอบลำดับการเช็ก (ป้องกันเช็กเอาต์โดยไม่เช็กอิน)
    if (!hasCheckedIn)
      return res.status(400).json({ message: 'คุณต้องเช็คอินก่อน' });
    if (hasCheckedOut)
      return res
        .status(400)
        .json({ message: 'คุณได้เช็คเอาท์ไปแล้วสำหรับวันนี้' });

    // ดึงเวลาเลิกงานจากการตั้งค่าบริษัท
    const config = await Attendance.getWorkTime(req.companyId);

    const now = new Date();
    const endworkTime = new Date(`${now.toDateString()} ${config.endwork}`);

    // ถ้าเช็กเอาต์ก่อนเวลา ถือว่า "early"
    const status = now < endworkTime ? 'early' : 'ontime';

    // บันทึกข้อมูลการเช็กเอาต์ลงฐานข้อมูล
    await Attendance.checkOut(emp_id, status, req.companyId);

    res.status(200).json({ message: 'เช็คเอาท์สำเร็จ' });
  } catch (err) {
    console.error('Check-out error:', err);
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดระหว่างการเช็คเอาท์' });
  }
};
