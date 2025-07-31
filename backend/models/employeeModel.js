const query = require('../utils/db');
// REFACTORED: กำหนดฟิลด์ที่ปลอดภัยสำหรับดึงข้อมูล เพื่อหลีกเลี่ยงการส่งข้อมูลรหัสผ่าน
const SAFE_EMPLOYEE_FIELDS = `
    e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel,
    e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, e.emp_status,
    j.jobpos_name, e.company_id -- <--- เพิ่ม company_id
`;

const Employee = {
    /**
     * ดึงข้อมูลพนักงานทั้งหมดพร้อมเรียงลำดับและแบ่งหน้า (Pagination)
     * @param {object} options - อ็อพชันสำหรับ search, sort, order, page, limit, jobpos_id, status
     * @param {number} companyId - ID ของบริษัทที่ต้องการกรองข้อมูล
     * @returns {Promise<{data: Array, meta: object}>} - ข้อมูลพนักงานพร้อมข้อมูล meta สำหรับการแบ่งหน้า
     */
    getAll: async (options = {}, companyId) => { // <--- รับ companyId เข้ามา
        // 1. กำหนดค่าเริ่มต้นสำหรับ options ทั้งหมด
        const {
            sort = 'emp_name',
            order = 'asc',
            page = 1,
            limit = 10,
            jobpos_id = null,
            status = null,
            search = ''
        } = options;

        let params = [companyId]; // <--- เริ่มต้น params ด้วย companyId
        let whereClauses = ['e.company_id = ?']; // <--- เพิ่มเงื่อนไข company_id

        // 2. สร้างเงื่อนไข WHERE แบบไดนามิก
        if (search) {
            whereClauses.push(`(e.emp_name LIKE ? OR j.jobpos_name LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }
        if (jobpos_id) {
            whereClauses.push(`e.jobpos_id = ?`);
            params.push(jobpos_id);
        }
        if (status) {
            whereClauses.push(`e.emp_status = ?`);
            params.push(status);
        }
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 3. สร้าง SQL สำหรับนับจำนวนทั้งหมด (สำหรับ Pagination)
        const countSql = `SELECT COUNT(e.emp_id) as total FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id ${whereSql}`;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // 4. สร้าง SQL สำหรับดึงข้อมูล พร้อม Logic การเรียงลำดับที่ปลอดภัย
        const sortableColumns = {
            emp_name: 'e.emp_name',
            jobpos_name: 'j.jobpos_name',
            emp_startwork: 'e.emp_startwork',
            jobpos_id: 'e.jobpos_id'
        };
        const sortColumn = sortableColumns[sort] || sortableColumns.emp_name;
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        
        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
        `;
        
        // 5. เพิ่ม LIMIT / OFFSET และส่ง Query
        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const employees = await query(dataSql, finalParams);

        // 6. คืนค่าข้อมูลและ meta
        return {
            data: employees,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },

    /**
     * ดึงข้อมูลพนักงานรายบุคคลด้วย ID
     * @param {number} id - รหัสพนักงาน
     * @param {number} companyId - ID ของบริษัทที่ต้องการกรองข้อมูล
     * @returns {Promise<Array>} - ข้อมูลพนักงาน
     */
    getById: async (id, companyId) => { // <--- รับ companyId เข้ามา
        const sql = `
            SELECT
                e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel,
                e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, e.emp_status, -- เพิ่ม emp_status ด้วย
                j.jobpos_name, e.company_id
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.emp_id = ? AND e.company_id = ? -- <--- เพิ่มเงื่อนไข company_id
        `;
        const results = await query(sql, [id, companyId]); // <--- ส่ง companyId
        return results;
    },

    /**
     * เพิ่มพนักงานใหม่
     * @param {object} data - ข้อมูลพนักงาน
     * @param {number} companyId - ID ของบริษัทที่พนักงานสังกัด
     * @returns {Promise<object>} - ข้อมูลพนักงานที่ถูกสร้างขึ้น
     */
    create: async (data, companyId) => { // <--- รับ companyId เข้ามา
        const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday } = data;
        
        // ตรวจสอบ email หรือ username ซ้ำภายในบริษัทเดียวกันเท่านั้น
        const existingEmployee = await query(
            'SELECT emp_id FROM employee WHERE (emp_email = ? OR emp_username = ?) AND company_id = ?',
            [emp_email, emp_username, companyId]
        );
        if (existingEmployee.length > 0) {
            throw new Error('Email หรือ Username นี้มีผู้ใช้งานแล้วในบริษัทของคุณ');
        }

        const insertSql = `
            INSERT INTO employee
            (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)
        `; // <--- เพิ่ม company_id
        const params = [emp_name, parseInt(jobpos_id), emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, companyId];
        
        const result = await query(insertSql, params);
        const newEmployeeId = result.insertId;
        const [newEmployeeData] = await Employee.getById(newEmployeeId, companyId); // <--- ส่ง companyId ไปด้วย
        return newEmployeeData;
    },

    /**
     * อัปเดตข้อมูลพนักงาน
     * @param {number} id - รหัสพนักงานที่ต้องการอัปเดต
     * @param {object} data - ข้อมูลที่ต้องการอัปเดต
     * @param {number} companyId - ID ของบริษัทที่พนักงานสังกัด
     * @returns {Promise<object>} - ข้อมูลพนักงานที่ถูกอัปเดต
     */
    update: async (id, data, companyId) => { // <--- รับ companyId เข้ามา
        const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic, emp_status } = data; // รับ emp_status เข้ามาด้วย
        const sql = `
            UPDATE employee
            SET emp_name = ?, jobpos_id = ?, emp_email = ?, emp_tel = ?, emp_address = ?, emp_pic = ?, emp_status = ?
            WHERE emp_id = ? AND company_id = ? -- <--- เพิ่มเงื่อนไข company_id
        `;
        const params = [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic, emp_status, id, companyId];
        await query(sql, params);

        return await Employee.getById(id, companyId); // <--- ส่ง companyId ไปด้วย
    },

    /**
     * ลบพนักงาน
     * @param {number} id - รหัสพนักงานที่ต้องการลบ
     * @param {number} companyId - ID ของบริษัทที่พนักงานสังกัด
     * @returns {Promise<object>} - ผลลัพธ์การลบ
     */
    delete: async (id, companyId) => { // <--- รับ companyId เข้ามา
        return await query('DELETE FROM employee WHERE emp_id = ? AND company_id = ?', [id, companyId]); // <--- เพิ่มเงื่อนไข company_id
    },
    
    /**
     * ค้นหาพนักงาน (เพิ่ม Pagination และเลือกฟิลด์)
     * @param {string} searchTerm - คำค้นหา
     * @param {string} sortField - ฟิลด์ที่ใช้เรียงลำดับ
     * @param {string} sortOrder - 'ASC' หรือ 'DESC'
     * @param {number} page - หน้าปัจจุบัน
     * @param {number} limit - จำนวนรายการต่อหน้า
     * @param {number} companyId - ID ของบริษัทที่ต้องการกรองข้อมูล
     * @returns {Promise<{data: Array, meta: object}>} - ข้อมูลพนักงานพร้อมข้อมูล meta สำหรับการแบ่งหน้า
     */
    searchEmployees: async (searchTerm, sortField, sortOrder, page = 1, limit = 10, companyId) => { // <--- รับ companyId
        const searchPattern = `%${searchTerm}%`;
        
        // Query เพื่อนับจำนวน
        const countSql = `
            SELECT COUNT(e.emp_id) as total
            FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.company_id = ? AND (e.emp_name LIKE ? OR j.jobpos_name LIKE ?)`; // <--- เพิ่ม company_id
        
        const [totalResult] = await query(countSql, [companyId, searchPattern, searchPattern]); // <--- ส่ง companyId
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query เพื่อดึงข้อมูล
        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.company_id = ? AND (e.emp_name LIKE ? OR j.jobpos_name LIKE ?)
        `; // <--- เพิ่ม company_id

        // ส่วนของ ORDER BY
        if (sortField === 'emp_name') {
            dataSql += ` ORDER BY CAST(REGEXP_SUBSTR(e.emp_name, '[0-9]+') AS UNSIGNED) ${sortOrder}, e.emp_name ${sortOrder}`;
        } else if (sortField === 'jobpos_name') {
            dataSql += ` ORDER BY j.jobpos_id ${sortOrder} `;
        } else {
            const allowedFields = ['emp_startwork', 'emp_id'];
            if(allowedFields.includes(sortField)) {
                dataSql += ` ORDER BY e.${sortField} ${sortOrder} `;
            } else {
                dataSql += ` ORDER BY e.emp_name ASC `;
            }
        }

        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ? `;
        
        const employees = await query(dataSql, [companyId, searchPattern, searchPattern, parseInt(limit), parseInt(offset)]); // <--- ส่ง companyId

        return {
            data: employees,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },

    /**
     * ดึงข้อมูลพนักงานตาม Job Position ID
     * @param {number} jobposId - รหัสตำแหน่งงาน
     * @param {number} companyId - ID ของบริษัทที่ต้องการกรองข้อมูล
     * @returns {Promise<Array>} - รายชื่อพนักงาน
     */
    getByJobposId: async (jobposId, companyId) => { // <--- รับ companyId
        const sql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.jobpos_id = ? AND e.company_id = ? -- <--- เพิ่มเงื่อนไข company_id
        `;
        return await query(sql, [jobposId, companyId]); // <--- ส่ง companyId
    },
};

module.exports = Employee;