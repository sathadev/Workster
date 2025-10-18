// backend/controllers/leaveworkController.js
// Controller สำหรับจัดการคำขอลา (Leave Requests)

const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-requests
// (Admin) ดึงข้อมูลคำขอลาทั้งหมด พร้อม Search, Sort, Filter, และ Pagination
exports.getAllLeaveRequests = async (req, res) => {
    try {
        console.log('Controller: getAllLeaveRequests called with query:', req.query, 'and companyId:', req.companyId);

        // ส่ง req.query (search, leaveworktype_id, status, sort, order, page, limit) และ companyId ไปยัง Model
        const requests = await LeaveworkModel.getAllLeaveRequests(req.query, req.companyId);
        res.status(200).json(requests);
    } catch (err) {
        console.error("API Error [getAllLeaveRequests]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา" });
    }
};

// [GET] /api/v1/leave-requests/my-requests
// (User) ดึงประวัติการลาของพนักงานคนปัจจุบัน (อิงจาก emp_id ใน JWT)
exports.getMyLeaveRequests = async (req, res) => {
    try {
        const { emp_id } = req.user;
        console.log('Controller: getMyLeaveRequests called for emp_id:', emp_id, 'and companyId:', req.companyId);

        // ดึงข้อมูลคำขอลาตาม emp_id ของผู้ใช้ปัจจุบัน
        const myRequests = await LeaveworkModel.getLeaveByEmpId(emp_id, req.companyId);
        res.status(200).json(myRequests);
    } catch (err) {
        console.error("API Error [getMyLeaveRequests]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงประวัติการลา" });
    }
};

// [POST] /api/v1/leave-requests
// (User) สร้างคำขอลาใหม่
exports.createLeaveRequest = async (req, res) => {
    try {
        // รวมข้อมูลจาก body และเพิ่ม emp_id ของผู้ที่ขอลา
        const data = { ...req.body, emp_id: req.user.emp_id };
        console.log('Controller: createLeaveRequest called with data:', data, 'and companyId:', req.companyId);

        const newRequest = await LeaveworkModel.createLeaveRequest(data, req.companyId);
        res.status(201).json(newRequest);
    } catch (err) {
        console.error("API Error [createLeaveRequest]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างคำขอลา" });
    }
};

// [PATCH] /api/v1/leave-requests/:id/status
// (Admin) อัปเดตสถานะคำขอลา (approved หรือ rejected)
exports.updateLeaveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // ตรวจสอบค่าที่ส่งมา ต้องเป็น approved หรือ rejected เท่านั้น
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "กรุณาส่งสถานะที่ถูกต้อง (approved หรือ rejected)" });
        }

        console.log(`Controller: updateLeaveStatus called for ID ${id} with status ${status} and companyId:`, req.companyId);

        const updatedRequest = await LeaveworkModel.updateLeaveStatus(id, status, req.companyId);
        res.status(200).json(updatedRequest);
    } catch (err) {
        console.error("API Error [updateLeaveStatus]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะคำขอลา" });
    }
};
