const LeaveworkModel = require('../models/leaveworkModel');

/**
 * แสดงรายการคำร้องขอลาทั้งหมด
 */
exports.index = async (req, res) => {
  try {
    const leaveworks = await LeaveworkModel.getAllLeaveRequests();
    res.render('leavework/index', { leaveworks });
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูล");
  }
};

/**
 * แสดงฟอร์มสำหรับยื่นเรื่องลา และประวัติการลาของพนักงาน
 */
exports.requestForm = async (req, res) => {
  const emp_id = req.session.user?.emp_id;

  if (!emp_id) {
    return res.redirect('/login'); // ถ้ายังไม่ได้ login
  }

  try {
    // ดึงข้อมูลประวัติการลาและประเภทการลาทั้งหมดพร้อมกัน
    const [leaveworks, leaveTypes] = await Promise.all([
      LeaveworkModel.getLeaveByEmpId(emp_id),
      LeaveworkModel.getAllLeaveTypes()
    ]);

    res.render('leavework/request', {
      leaveworks,
      leaveTypes,
      emp_id
    });
  } catch (err) {
    console.error("Error fetching leave form data:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการโหลดหน้าฟอร์ม");
  }
};

/**
 * สร้างคำร้องขอลาใหม่
 */
exports.create = async (req, res) => {
  const emp_id = req.session.user?.emp_id;
  if (!emp_id) {
    return res.redirect('/login');
  }

  const data = {
    ...req.body, // ใช้ Spread syntax เพื่อความกระชับ
    emp_id: emp_id,
  };

  try {
    await LeaveworkModel.createLeaveRequest(data);
    res.redirect('/request'); // หรือไปยังหน้าที่แสดงประวัติการลา
  } catch (err) {
    console.error("Error creating leave request:", err);
    res.status(500).send("บันทึกคำร้องขอลาไม่สำเร็จ");
  }
};

/**
 * อนุมัติคำร้องขอลา
 */
exports.approve = async (req, res) => {
  try {
    const id = req.params.id;
    await LeaveworkModel.updateLeaveStatus(id, 'approved');
    res.redirect('/leave-work');
  } catch (err) {
    console.error("Error approving leave:", err);
    res.status(500).send("การอนุมัติไม่สำเร็จ");
  }
};

/**
 * ปฏิเสธคำร้องขอลา
 */
exports.reject = async (req, res) => {
  try {
    const id = req.params.id;
    await LeaveworkModel.updateLeaveStatus(id, 'rejected');
    res.redirect('/leave-work');
  } catch (err) {
    console.error("Error rejecting leave:", err);
    res.status(500).send("การปฏิเสธไม่สำเร็จ");
  }
};