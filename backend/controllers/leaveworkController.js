// backend/controllers/leaveworkController.js
const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-requests -> (Admin) ดึงคำขอทั้งหมด
exports.getAllLeaveRequests = async (req, res) => {
    try {
        // ส่ง req.companyId ไปยัง Model
        const requests = await LeaveworkModel.getAllLeaveRequests(req.companyId); // <-- เพิ่ม req.companyId
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา" });
    }
};

// [GET] /api/v1/leave-requests/my-requests -> (User) ดึงประวัติการลาของตัวเอง
exports.getMyLeaveRequests = async (req, res) => {
    try {
        const { emp_id } = req.user;
        // ส่ง req.companyId ไปยัง Model
        const myRequests = await LeaveworkModel.getLeaveByEmpId(emp_id, req.companyId); // <-- เพิ่ม req.companyId
        res.status(200).json(myRequests);
    } catch (err) {
        console.error("API Error [getMyLeaveRequests]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการลา" });
    }
};

// [POST] /api/v1/leave-requests -> (User) สร้างคำขอลาใหม่
exports.createLeaveRequest = async (req, res) => {
    try {
        // ส่ง req.companyId ไปยัง Model
        const data = { ...req.body, emp_id: req.user.emp_id };
        const newRequest = await LeaveworkModel.createLeaveRequest(data, req.companyId); // <-- เพิ่ม req.companyId
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("API Error [createLeaveRequest]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำขอลา" });
    }
};

// [PATCH] /api/v1/leave-requests/:id/status -> (Admin) อนุมัติ/ปฏิเสธคำขอ
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "กรุณาส่งสถานะที่ถูกต้อง (approved หรือ rejected)" });
        }

        // ส่ง req.companyId ไปยัง Model
        const updatedRequest = await LeaveworkModel.updateLeaveStatus(id, status, req.companyId); // <-- เพิ่ม req.companyId
        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
};