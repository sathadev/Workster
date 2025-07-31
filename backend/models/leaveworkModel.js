// backend/models/leaveworkModel.js
const query = require('../utils/db');
const LeaveworkModel = {
    // ดึงคำขอลาทั้งหมดสำหรับ Admin/HR (พร้อม Search, Sort, Filter, Pagination)
  getAllLeaveRequests: async (options = {}, companyId) => {
        // ดึงค่า status โดยให้ความสำคัญกับ 'status[]' ก่อน ถ้ามี
        // ถ้าไม่มี 'status[]' ให้ใช้ 'status' (ซึ่งจะมาจากหน้า LeaveRequestListPage.jsx ที่ส่ง status: 'pending')
        let {
            search = '',
            leaveworktype_id = '',
            sort = 'lw.leavework_daterequest',
            order = 'desc',
            page = 1,
            limit = 10
        } = options;

        // แยกการดึง status ออกมาเพื่อจัดการพิเศษ
        let statusFilter = options['status[]'] || options.status;
        // ถ้า statusFilter เป็น String ให้แปลงเป็น Array เพื่อใช้ IN clause ได้
        // แต่ถ้าต้องการให้ใช้ '=' เมื่อเป็น String ก็ไม่จำเป็นต้องแปลง
        // ในกรณีนี้ ถ้า frontend ส่ง 'pending' มา เราจะใช้ = 'pending'
        // ถ้า frontend ส่ง ['approved', 'rejected'] มา เราจะใช้ IN ('approved', 'rejected')
        
        console.log('Model: Received options:', options);
        console.log('Model: Derived statusFilter:', statusFilter); // Log ค่า statusFilter ที่ถูกดึงมา
        console.log('Model: Is statusFilter an array?', Array.isArray(statusFilter));

        let params = [companyId];
        let whereClauses = ['lw.company_id = ?'];

        if (search) {
            whereClauses.push(`e.emp_name LIKE ?`);
            params.push(`%${search}%`);
        }

        if (leaveworktype_id) {
            whereClauses.push(`lw.leaveworktype_id = ?`);
            params.push(parseInt(leaveworktype_id));
        }

        // 3. Filter (กรองตามสถานะ - รองรับทั้ง String และ Array)
        if (statusFilter !== undefined && statusFilter !== null && statusFilter !== '') { // ตรวจสอบว่ามีค่าสถานะ
            if (Array.isArray(statusFilter)) {
                if (statusFilter.length > 0) { // <--- **เพิ่มเงื่อนไขนี้!** ตรวจสอบว่า Array ไม่ว่าง
                    console.log('Model: Applying IN clause for status:', statusFilter);
                    whereClauses.push(`lw.leavework_status IN (?)`);
                    params.push(statusFilter);
                } else {
                    console.log('Model: Status array is empty, skipping status filter.');
                    // ถ้า array ว่าง ก็ไม่ต้องเพิ่ม where clause สำหรับ status
                }
            } else { // ถ้าไม่ใช่ Array (เป็น String เช่น 'pending')
                console.log('Model: Applying EQUAL clause for status:', statusFilter);
                whereClauses.push(`lw.leavework_status = ?`);
                params.push(statusFilter);
            }
        } else {
            console.log('Model: No specific status filter applied.');
        }


        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // SQL สำหรับนับจำนวนทั้งหมด (สำหรับ Pagination)
        const countSql = `
            SELECT COUNT(lw.leavework_id) as total
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

        // SQL สำหรับดึงข้อมูลจริง
        const sortableColumns = {
            emp_name: 'e.emp_name',
            leaveworktype_id: 'lw.leaveworktype_id',
            leavework_daterequest: 'lw.leavework_daterequest',
            leavework_status: 'lw.leavework_status'
        };
        const sortColumn = sortableColumns[sort] || 'lw.leavework_daterequest';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

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
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },


    // ดึงคำขอลาเดียวด้วย ID ของคำขอ
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

    // สร้างคำขอลาใหม่
    createLeaveRequest: async (data, companyId) => {
        const sql = `
            INSERT INTO leavework (leavework_datestart, leavework_end, leavework_daterequest, leavework_description, emp_id, leaveworktype_id, leavework_status, company_id)
            VALUES (?, ?, NOW(), ?, ?, ?, 'pending', ?)
        `;
        const values = [data.leavework_datestart, data.leavework_end, data.leavework_description, data.emp_id, data.leaveworktype_id, companyId];
        const result = await query(sql, values);
        return await LeaveworkModel.getLeaveRequestById(result.insertId, companyId);
    },

    // อัปเดตสถานะการลา (อนุมัติ/ปฏิเสธ)
    updateLeaveStatus: async (leavework_id, status, companyId) => {
        const sql = `UPDATE leavework SET leavework_status = ? WHERE leavework_id = ? AND company_id = ?`;
        await query(sql, [status, leavework_id, companyId]);
        return await LeaveworkModel.getLeaveRequestById(leavework_id, companyId);
    },

    // ดึงประวัติการลาทั้งหมดของพนักงานคนเดียว
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

    // ดึงประเภทการลาทั้งหมด (Global)
    getAllLeaveTypes: async () => {
        const sql = `SELECT * FROM leaveworktype ORDER BY leaveworktype_name ASC`;
        return await query(sql);
    },

    // ดึงจำนวนวันลาที่อนุมัติแล้ว
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
