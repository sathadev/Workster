// backend/models/leaveworkModel.js
// Model สำหรับจัดการข้อมูล "คำขอลา (Leavework)" และ "ประเภทการลา (LeaveworkType)"

const query = require('../utils/db');

const LeaveworkModel = {
    // [ADMIN] ดึงคำขอลาทั้งหมด (พร้อม Search, Sort, Filter, Pagination)
    getAllLeaveRequests: async (options = {}, companyId) => {
        // แยกค่าพารามิเตอร์ที่ส่งมาจาก req.query
        let {
            search = '',
            leaveworktype_id = '',
            sort = 'lw.leavework_daterequest',
            order = 'desc',
            page = 1,
            limit = 10
        } = options;

        // ดึงค่า status จาก query (รองรับทั้ง status และ status[])
        let statusFilter = options['status[]'] || options.status;

        console.log('Model: Received options:', options);
        console.log('Model: Derived statusFilter:', statusFilter);
        console.log('Model: Is statusFilter an array?', Array.isArray(statusFilter));

        let params = [companyId];
        let whereClauses = ['lw.company_id = ?'];

        // ค้นหาตามชื่อพนักงาน
        if (search) {
            whereClauses.push(`e.emp_name LIKE ?`);
            params.push(`%${search}%`);
        }

        // กรองตามประเภทการลา
        if (leaveworktype_id) {
            whereClauses.push(`lw.leaveworktype_id = ?`);
            params.push(parseInt(leaveworktype_id));
        }

        // กรองตามสถานะ (รองรับทั้ง String และ Array)
        if (statusFilter !== undefined && statusFilter !== null && statusFilter !== '') {
            if (Array.isArray(statusFilter)) {
                if (statusFilter.length > 0) {
                    console.log('Model: Applying IN clause for status:', statusFilter);
                    whereClauses.push(`lw.leavework_status IN (?)`);
                    params.push(statusFilter);
                } else {
                    console.log('Model: Status array is empty, skipping status filter.');
                }
            } else {
                console.log('Model: Applying EQUAL clause for status:', statusFilter);
                whereClauses.push(`lw.leavework_status = ?`);
                params.push(statusFilter);
            }
        } else {
            console.log('Model: No specific status filter applied.');
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // นับจำนวนทั้งหมด (ใช้สำหรับ Pagination)
        const countSql = `
            SELECT COUNT(lw.leavework_id) AS total
            FROM leavework lw
            JOIN employee e ON lw.emp_id = e.emp_id
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            ${whereSql}
        `;
        console.log('getAllLeaveRequests Count SQL:', countSql);
        console.log('getAllLeaveRequests Count Params:', params);

        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // กำหนดคอลัมน์ที่ใช้ sort ได้
        const sortableColumns = {
            emp_name: 'e.emp_name',
            leaveworktype_id: 'lw.leaveworktype_id',
            leavework_daterequest: 'lw.leavework_daterequest',
            leavework_status: 'lw.leavework_status'
        };
        const sortColumn = sortableColumns[sort] || 'lw.leavework_daterequest';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // ดึงข้อมูลจริงตามหน้า (page)
        const dataSql = `
            SELECT lw.*, e.emp_name, lt.leaveworktype_name, jp.jobpos_name
            FROM leavework lw
            JOIN employee e ON lw.emp_id = e.emp_id
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];

        console.log('getAllLeaveRequests Data SQL:', dataSql);
        console.log('getAllLeaveRequests Data Params:', finalParams);

        const requests = await query(dataSql, finalParams);

        return {
            data: requests,
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            },
        };
    },

    // [ADMIN/USER] ดึงคำขอลาเดี่ยวตาม ID
    getLeaveRequestById: async (id, companyId) => {
        const sql = `
            SELECT lw.*, e.emp_name, lt.leaveworktype_name, jp.jobpos_name
            FROM leavework lw
            JOIN employee e ON lw.emp_id = e.emp_id
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            WHERE lw.leavework_id = ? AND lw.company_id = ?
        `;
        const results = await query(sql, [id, companyId]);
        return results[0] || null;
    },

    // [USER] สร้างคำขอลาใหม่
    createLeaveRequest: async (data, companyId) => {
        const sql = `
            INSERT INTO leavework
            (leavework_datestart, leavework_end, leavework_daterequest, leavework_description,
             emp_id, leaveworktype_id, leavework_status, company_id)
            VALUES (?, ?, NOW(), ?, ?, ?, 'pending', ?)
        `;
        const values = [
            data.leavework_datestart,
            data.leavework_end,
            data.leavework_description,
            data.emp_id,
            data.leaveworktype_id,
            companyId
        ];
        const result = await query(sql, values);
        return await LeaveworkModel.getLeaveRequestById(result.insertId, companyId);
    },

    // [ADMIN] อัปเดตสถานะคำขอลา (อนุมัติ / ปฏิเสธ)
    updateLeaveStatus: async (leavework_id, status, companyId) => {
        const sql = `
            UPDATE leavework
            SET leavework_status = ?
            WHERE leavework_id = ? AND company_id = ?
        `;
        await query(sql, [status, leavework_id, companyId]);
        return await LeaveworkModel.getLeaveRequestById(leavework_id, companyId);
    },

    // [USER] ดึงประวัติการลาของพนักงาน (เฉพาะคนที่ล็อกอิน)
    getLeaveByEmpId: async (emp_id, companyId) => {
        const sql = `
            SELECT lw.*, lt.leaveworktype_name
            FROM leavework lw
            JOIN leaveworktype lt ON lw.leaveworktype_id = lt.leaveworktype_id
            WHERE lw.emp_id = ? AND lw.company_id = ?
            ORDER BY lw.leavework_daterequest DESC
        `;
        return await query(sql, [emp_id, companyId]);
    },

    // [GLOBAL] ดึงประเภทการลาทั้งหมด (ใช้ได้ทั้ง HR และพนักงาน)
    getAllLeaveTypes: async () => {
        const sql = `SELECT * FROM leaveworktype ORDER BY leaveworktype_name ASC`;
        return await query(sql);
    },

    // [HELPER] ดึงจำนวนคำขอลาที่ "อนุมัติแล้ว" ของพนักงาน
    getApprovedLeaveCountByEmpId: async (emp_id, companyId) => {
        const sql = `
            SELECT COUNT(*) AS approved_leave_count
            FROM leavework
            WHERE emp_id = ? AND leavework_status = 'approved' AND company_id = ?
        `;
        const results = await query(sql, [emp_id, companyId]);
        return results[0]?.approved_leave_count || 0;
    }
};

module.exports = LeaveworkModel;
