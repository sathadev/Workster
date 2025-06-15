// backend/controllers/leaveworkController.js
const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-requests -> (Admin) ดึงคำขอทั้งหมด
exports.getAllLeaveRequests = async (req, res) => {
    try {
        const requests = await LeaveworkModel.getAllLeaveRequests();
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา" });
    }
};

// [GET] /api/v1/leave-requests/my-requests -> (User) ดึงประวัติการลาของตัวเอง
exports.getMyLeaveRequests = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const { emp_id } = req.session.user;
        const myRequests = await LeaveworkModel.getLeaveByEmpId(emp_id);
        res.status(200).json(myRequests);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการลา" });
    }
};

// [POST] /api/v1/leave-requests -> (User) สร้างคำขอลาใหม่
exports.createLeaveRequest = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const data = { ...req.body, emp_id: req.session.user.emp_id };
        const newRequest = await LeaveworkModel.createLeaveRequest(data);
        res.status(201).json(newRequest);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำขอลา" });
    }
};

// [PATCH] /api/v1/leave-requests/:id/status -> (Admin) อนุมัติ/ปฏิเสธคำขอ
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // status ควรเป็น 'approved' หรือ 'rejected'

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "กรุณาส่งสถานะที่ถูกต้อง (approved หรือ rejected)" });
        }

        const updatedRequest = await LeaveworkModel.updateLeaveStatus(id, status);
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
};