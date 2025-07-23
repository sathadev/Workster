// backend/models/leaveworkModel.js
const util = require('util');
const db = require('../config/db');

const query = util.promisify(db.query).bind(db);

const LeaveworkModel = {
    // ดึงคำขอลาทั้งหมดสำหรับ Admin/HR
    getAllLeaveRequests: async (companyId) => { // <-- รับ companyId
        const sql = `
            SELECT lw.*, e.emp_name, lt.leaveworktype_name, jp.jobpos_name
            FROM leavework lw
            JOIN employee e ON lw.emp_id = e.emp_id
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            WHERE lw.company_id = ? -- <-- เพิ่ม WHERE clause
            ORDER BY lw.leavework_daterequest DESC
        `;
        return await query(sql, [companyId]); // <-- ส่ง companyId
    },

    // ดึงคำขอลาเดียวด้วย ID ของคำขอ
    getLeaveRequestById: async (id, companyId) => { // <-- รับ companyId
        const sql = `
            SELECT lw.*, e.emp_name, lt.leaveworktype_name, jp.jobpos_name
            FROM leavework lw
            JOIN employee e ON lw.emp_id = e.emp_id
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            WHERE lw.leavework_id = ? AND lw.company_id = ? -- <-- เพิ่ม WHERE clause
        `;
        const results = await query(sql, [id, companyId]); // <-- ส่ง companyId
        return results[0] || null;
    },

    // สร้างคำขอลาใหม่
    createLeaveRequest: async (data, companyId) => { // <-- รับ companyId
        const sql = `
            INSERT INTO leavework (leavework_datestart, leavework_end, leavework_daterequest, leavework_description, emp_id, leaveworktype_id, leavework_status, company_id)
            VALUES (?, ?, NOW(), ?, ?, ?, 'pending', ?)
        `; // <-- เพิ่ม company_id
        const values = [data.leavework_datestart, data.leavework_end, data.leavework_description, data.emp_id, data.leaveworktype_id, companyId]; // <-- ส่ง companyId
        const result = await query(sql, values);
        return await LeaveworkModel.getLeaveRequestById(result.insertId, companyId); // <-- ส่ง companyId
    },

    // อัปเดตสถานะการลา (อนุมัติ/ปฏิเสธ)
    updateLeaveStatus: async (leavework_id, status, companyId) => { // <-- รับ companyId
        const sql = `UPDATE leavework SET leavework_status = ? WHERE leavework_id = ? AND company_id = ?`; // <-- เพิ่ม WHERE clause
        await query(sql, [status, leavework_id, companyId]); // <-- ส่ง companyId
        return await LeaveworkModel.getLeaveRequestById(leavework_id, companyId); // <-- ส่ง companyId
    },

    // ดึงประวัติการลาทั้งหมดของพนักงานคนเดียว
    getLeaveByEmpId: async (emp_id, companyId) => { // <-- รับ companyId
        const sql = `
            SELECT lw.*, lt.leaveworktype_name
            FROM leavework lw
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            WHERE lw.emp_id = ? AND lw.company_id = ? -- <-- เพิ่ม WHERE clause
            ORDER BY lw.leavework_daterequest DESC
        `;
        return await query(sql, [emp_id, companyId]); // <-- ส่ง companyId
    },

    // ดึงประเภทการลาทั้งหมด (ถ้าเป็น Global ไม่ต้องแก้ไข)
    getAllLeaveTypes: async () => {
        const sql = `SELECT * FROM leaveworktype ORDER BY leaveworktype_name ASC`;
        return await query(sql);
    },

    // ดึงจำนวนวันลาที่อนุมัติแล้ว
    getApprovedLeaveCountByEmpId: async (emp_id, companyId) => { // <-- รับ companyId
        const sql = `
            SELECT COUNT(*) AS approved_leave_count
            FROM leavework
            WHERE emp_id = ? AND leavework_status = 'approved' AND company_id = ? -- <-- เพิ่ม WHERE clause
        `;
        const results = await query(sql, [emp_id, companyId]); // <-- ส่ง companyId
        return results[0]?.approved_leave_count || 0;
    }
};

module.exports = LeaveworkModel;