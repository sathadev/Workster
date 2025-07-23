// backend/controllers/attendanceController.js
const Attendance = require('../models/attendanceModel');

exports.getTodaysUserAttendance = async (req, res) => {
    try {
        const { emp_id } = req.user;
        
        const [records, config] = await Promise.all([
            Attendance.getTodayAttendance(emp_id, req.companyId), // <--- PASS req.companyId
            Attendance.getWorkTime(req.companyId) // <--- PASS req.companyId
        ]);
        
        const formatTime = (datetime) => datetime ? new Date(datetime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' }) : null;

        const checkin = records.find(r => r.attendance_type === 'checkin');
        const checkout = records.find(r => r.attendance_type === 'checkout');
        
        const now = new Date();
        const endworkTime = new Date(`${now.toDateString()} ${config.endwork}`);
        const isAfterEndWork = now >= endworkTime;

        res.status(200).json({
            checkinTime: formatTime(checkin?.attendance_datetime),
            checkoutTime: formatTime(checkout?.attendance_datetime),
            hasCheckedIn: !!checkin,
            hasCheckedOut: !!checkout,
            isAfterEndWork,
        });
    } catch (err) {
        console.error("API Error [getTodaysUserAttendance]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการโหลดข้อมูลการลงเวลา" });
    }
};

exports.handleCheckIn = async (req, res) => {
    try {
        const { emp_id } = req.user;
        await Attendance.checkIn(emp_id, req.companyId); // <--- PASS req.companyId
        res.status(201).json({ message: 'เช็คอินสำเร็จ' });
    } catch (err) {
        console.error("Check-in error:", err);
        res.status(400).json({ message: err.message || 'เกิดข้อผิดพลาดในการเช็คอิน' });
    }
};

exports.handleCheckOut = async (req, res) => {
    try {
        const { emp_id } = req.user;
        const records = await Attendance.getTodayAttendance(emp_id, req.companyId); // <--- PASS req.companyId
        const hasCheckedIn = records.some(r => r.attendance_type === 'checkin');
        const hasCheckedOut = records.some(r => r.attendance_type === 'checkout');

        if (!hasCheckedIn) return res.status(400).json({ message: "คุณต้องเช็คอินก่อน" });
        if (hasCheckedOut) return res.status(400).json({ message: "คุณได้เช็คเอาท์ไปแล้วสำหรับวันนี้" });
        
        const config = await Attendance.getWorkTime(req.companyId); // <--- PASS req.companyId
        const now = new Date();
        const endworkTime = new Date(`${now.toDateString()} ${config.endwork}`);
        const status = now < endworkTime ? 'early' : 'ontime';

        await Attendance.checkOut(emp_id, status, req.companyId); // <--- PASS req.companyId
        res.status(200).json({ message: 'เช็คเอาท์สำเร็จ' });
    } catch (err) {
        console.error("Check-out error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดระหว่างการเช็คเอาท์" });
    }
};