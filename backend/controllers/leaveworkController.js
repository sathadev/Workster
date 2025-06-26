// backend/controllers/leaveworkController.js
const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-requests -> (Admin) ดึงคำขอทั้งหมด
exports.getAllLeaveRequests = async (req, res) => {
    // ฟังก์ชันนี้ถูกต้องแล้ว (แต่ Route ต้องมี protect)
    try {
        const requests = await LeaveworkModel.getAllLeaveRequests();
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา" });
    }
};

// [GET] /api/v1/leave-requests/my-requests -> (User) ดึงประวัติการลาของตัวเอง
exports.getMyLeaveRequests = async (req, res) => {
    // --- ส่วนที่แก้ไข ---
    // ไม่ต้องมี if check แล้ว เพราะ protect middleware จัดการให้
    try {
        // เปลี่ยนมาใช้ req.user แทน
        const { emp_id } = req.user;
        const myRequests = await LeaveworkModel.getLeaveByEmpId(emp_id);
        res.status(200).json(myRequests);
    } catch (err) {
        console.error("API Error [getMyLeaveRequests]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการลา" });
    }
    // --- จบส่วนแก้ไข ---
};

// [POST] /api/v1/leave-requests -> (User) สร้างคำขอลาใหม่
exports.createLeaveRequest = async (req, res) => {
    // --- ส่วนที่แก้ไข ---
    // ไม่ต้องมี if check แล้ว
    try {
        // เปลี่ยนมาใช้ emp_id จาก req.user
        const data = { ...req.body, emp_id: req.user.emp_id };
        const newRequest = await LeaveworkModel.createLeaveRequest(data);
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("API Error [createLeaveRequest]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำขอลา" });
    }
    // --- จบส่วนแก้ไข ---
};

// [PATCH] /api/v1/leave-requests/:id/status -> (Admin) อนุมัติ/ปฏิเสธคำขอ
exports.updateLeaveStatus = async (req, res) => {
    // ฟังก์ชันนี้ถูกต้องแล้ว (แต่ Route ต้องมี protect)
    try {
        const { id } = req.params;
        const { status } = req.body; 

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "กรุณาส่งสถานะที่ถูกต้อง (approved หรือ rejected)" });
        }

        const updatedRequest = await LeaveworkModel.updateLeaveStatus(id, status);
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
};