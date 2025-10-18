// backend/controllers/leaveTypesController.js
// Controller สำหรับจัดการข้อมูล "ประเภทการลา (Leave Types)"

const LeaveworkModel = require('../models/leaveworkModel');

// [GET] /api/v1/leave-types
// ดึงข้อมูลประเภทการลาทั้งหมดจากระบบ
// ใช้สำหรับแสดงรายการประเภทการลาให้ HR หรือพนักงานเลือก
exports.getAllLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await LeaveworkModel.getAllLeaveTypes();
        res.status(200).json(leaveTypes);
    } catch (err) {
        console.error("API Error [getAllLeaveTypes]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประเภทการลา" });
    }
};
