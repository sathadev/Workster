// backend/controllers/leaveTypesController.js
const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-types -> ดึงประเภทการลาทั้งหมด
exports.getAllLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await LeaveworkModel.getAllLeaveTypes();
        res.status(200).json(leaveTypes);
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประเภทการลา" });
    }
};