// backend/models/employeeModel.js
// Model สำหรับจัดการข้อมูลพนักงาน (Employee)
// เช่น ดึงข้อมูล, เพิ่ม, แก้ไข, ลบ, ค้นหา และแบ่งหน้าพนักงานในแต่ละบริษัท

const query = require('../utils/db'); // ใช้เชื่อมต่อและสั่ง SQL กับฐานข้อมูล

// ฟิลด์ที่อนุญาตให้ดึง (ป้องกันไม่ให้ส่งข้อมูลที่อ่อนไหว เช่น รหัสผ่าน)
const SAFE_EMPLOYEE_FIELDS = `
    e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel,
    e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, e.emp_status,
    j.jobpos_name, e.company_id
`;

const Employee = {

    // [GET] ดึงข้อมูลพนักงานทั้งหมด (พร้อมกรอง, ค้นหา, เรียงลำดับ, และแบ่งหน้า)
    getAll: async (options = {}, companyId) => {
        const {
            sort = 'emp_name',
            order = 'asc',
            page = 1,
            limit = 10,
            jobpos_id = null,
            status = null,
            search = ''
        } = options;

        // เริ่มต้นด้วยการกรองตาม company_id
        let params = [companyId];
        let whereClauses = ['e.company_id = ?'];

        // ถ้ามีการค้นหา (ชื่อพนักงานหรือชื่อตำแหน่ง)
        if (search) {
            whereClauses.push(`(e.emp_name LIKE ? OR j.jobpos_name LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }

        // กรองตามตำแหน่งงาน
        if (jobpos_id) {
            whereClauses.push(`e.jobpos_id = ?`);
            params.push(jobpos_id);
        }

        // กรองตามสถานะพนักงาน (active/inactive)
        if (status) {
            whereClauses.push(`e.emp_status = ?`);
            params.push(status);
        }

        // รวม WHERE ทั้งหมดเข้าด้วยกัน
        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Query สำหรับนับจำนวนข้อมูลทั้งหมด (เพื่อใช้คำนวณ pagination)
        const countSql = `
            SELECT COUNT(e.emp_id) as total
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            ${whereSql}
        `;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // คอลัมน์ที่อนุญาตให้เรียงได้
        const sortableColumns = {
            emp_name: 'e.emp_name',
            jobpos_name: 'j.jobpos_name',
            emp_startwork: 'e.emp_startwork',
            jobpos_id: 'e.jobpos_id'
        };

        // ตรวจสอบค่าว่าถูกต้องไหม ถ้าไม่ให้ fallback เป็น emp_name
        const sortColumn = sortableColumns[sort] || sortableColumns.emp_name;
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query ดึงข้อมูลพนักงานจริง
        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
        `;

        // แบ่งหน้า (Pagination)
        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];

        const employees = await query(dataSql, finalParams);

        // คืนค่าข้อมูลพนักงานและ metadata สำหรับ frontend
        return {
            data: employees,
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            },
        };
    },

    // [GET] ดึงข้อมูลพนักงานรายบุคคลตาม emp_id และ company_id
    getById: async (id, companyId) => {
        const sql = `
            SELECT
                e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel,
                e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, e.emp_status,
                j.jobpos_name, e.company_id
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.emp_id = ? AND e.company_id = ?
        `;
        return await query(sql, [id, companyId]);
    },

    // [POST] เพิ่มข้อมูลพนักงานใหม่ พร้อมตรวจสอบ email และ username ซ้ำภายในบริษัท
    create: async (data, companyId) => {
        const {
            emp_name, jobpos_id, emp_email, emp_tel, emp_address,
            emp_username, emp_password, emp_pic, emp_birthday
        } = data;

        // ตรวจสอบว่ามี email หรือ username ซ้ำหรือไม่ในบริษัทเดียวกัน
        const existingEmployee = await query(
            'SELECT emp_id FROM employee WHERE (emp_email = ? OR emp_username = ?) AND company_id = ?',
            [emp_email, emp_username, companyId]
        );
        if (existingEmployee.length > 0) {
            throw new Error('Email หรือ Username นี้มีผู้ใช้งานแล้วในบริษัทของคุณ');
        }

        // เพิ่มพนักงานใหม่ในฐานข้อมูล
        const insertSql = `
            INSERT INTO employee
            (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)
        `;
        const params = [
            emp_name, parseInt(jobpos_id), emp_email, emp_tel, emp_address,
            emp_username, emp_password, emp_pic, emp_birthday, companyId
        ];

        const result = await query(insertSql, params);
        const newEmployeeId = result.insertId;

        // ดึงข้อมูลพนักงานที่เพิ่งเพิ่มใหม่กลับมา
        const [newEmployeeData] = await Employee.getById(newEmployeeId, companyId);
        return newEmployeeData;
    },

    // [PUT] อัปเดตข้อมูลพนักงานตาม emp_id และ company_id
    update: async (id, data, companyId) => {
        const {
            emp_name, jobpos_id, emp_email, emp_tel,
            emp_address, emp_pic, emp_status
        } = data;

        const sql = `
            UPDATE employee
            SET emp_name = ?, jobpos_id = ?, emp_email = ?, emp_tel = ?, emp_address = ?, emp_pic = ?, emp_status = ?
            WHERE emp_id = ? AND company_id = ?
        `;
        const params = [
            emp_name, jobpos_id, emp_email, emp_tel,
            emp_address, emp_pic, emp_status, id, companyId
        ];

        await query(sql, params);
        return await Employee.getById(id, companyId);
    },

    // [DELETE] ลบพนักงานตาม emp_id และ company_id
    delete: async (id, companyId) => {
        return await query(
            'DELETE FROM employee WHERE emp_id = ? AND company_id = ?',
            [id, companyId]
        );
    },

    // [GET] ค้นหาพนักงานตามคำค้น (พร้อม Pagination และ Sorting)
    searchEmployees: async (searchTerm, sortField, sortOrder, page = 1, limit = 10, companyId) => {
        const searchPattern = `%${searchTerm}%`;

        // Query สำหรับนับจำนวนข้อมูลทั้งหมด
        const countSql = `
            SELECT COUNT(e.emp_id) as total
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.company_id = ? AND (e.emp_name LIKE ? OR j.jobpos_name LIKE ?)
        `;
        const [totalResult] = await query(countSql, [companyId, searchPattern, searchPattern]);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        // Query สำหรับดึงข้อมูลจริง
        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.company_id = ? AND (e.emp_name LIKE ? OR j.jobpos_name LIKE ?)
        `;

        // จัดลำดับ (Sorting)
        if (sortField === 'emp_name') {
            dataSql += ` ORDER BY CAST(REGEXP_SUBSTR(e.emp_name, '[0-9]+') AS UNSIGNED) ${sortOrder}, e.emp_name ${sortOrder}`;
        } else if (sortField === 'jobpos_name') {
            dataSql += ` ORDER BY j.jobpos_id ${sortOrder}`;
        } else {
            const allowedFields = ['emp_startwork', 'emp_id'];
            if (allowedFields.includes(sortField)) {
                dataSql += ` ORDER BY e.${sortField} ${sortOrder}`;
            } else {
                dataSql += ` ORDER BY e.emp_name ASC`;
            }
        }

        // Pagination
        const offset = (page - 1) * limit;
        dataSql += ` LIMIT ? OFFSET ?`;

        const employees = await query(dataSql, [
            companyId, searchPattern, searchPattern,
            parseInt(limit), parseInt(offset)
        ]);

        return {
            data: employees,
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            },
        };
    },

    // [GET] ดึงข้อมูลพนักงานทั้งหมดในตำแหน่งงานเดียวกัน (ตาม jobpos_id)
    getByJobposId: async (jobposId, companyId) => {
        const sql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.jobpos_id = ? AND e.company_id = ?
        `;
        return await query(sql, [jobposId, companyId]);
    },
};

module.exports = Employee;
