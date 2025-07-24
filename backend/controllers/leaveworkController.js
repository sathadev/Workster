// backend/controllers/leaveworkController.js
const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-requests -> (Admin) ดึงคำขอทั้งหมด (พร้อม Search, Sort, Filter, Pagination)
exports.getAllLeaveRequests = async (req, res) => {
    try {
        console.log('Controller: getAllLeaveRequests called with query:', req.query, 'and companyId:', req.companyId); // Debug Log
        // ส่ง req.query (ซึ่งมี search, leaveworktype_id, status, sort, order, page, limit) และ req.companyId ไปยัง Model
        const requests = await LeaveworkModel.getAllLeaveRequests(req.query, req.companyId);
        res.status(200).json(requests);
    } catch (err) {
        console.error("API Error [getAllLeaveRequests]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา" });
    }
};

// [GET] /api/v1/leave-requests/my-requests -> (User) ดึงประวัติการลาของตัวเอง
exports.getMyLeaveRequests = async (req, res) => {
    try {
        const { emp_id } = req.user;
        console.log('Controller: getMyLeaveRequests called for emp_id:', emp_id, 'and companyId:', req.companyId); // Debug Log
        const myRequests = await LeaveworkModel.getLeaveByEmpId(emp_id, req.companyId);
        res.status(200).json(myRequests);
    } catch (err) {
        console.error("API Error [getMyLeaveRequests]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการลา" });
    }
};

// [POST] /api/v1/leave-requests -> (User) สร้างคำขอลาใหม่
exports.createLeaveRequest = async (req, res) => {
    try {
        const data = { ...req.body, emp_id: req.user.emp_id };
        console.log('Controller: createLeaveRequest called with data:', data, 'and companyId:', req.companyId); // Debug Log
        const newRequest = await LeaveworkModel.createLeaveRequest(data, req.companyId);
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
        console.log(`Controller: updateLeaveStatus called for ID ${id} with status ${status} and companyId:`, req.companyId); // Debug Log
        const updatedRequest = await LeaveworkModel.updateLeaveStatus(id, status, req.companyId);
        res.status(200).json(updatedRequest);
    } catch (err) {
        console.error("API Error [updateLeaveStatus]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
};
