const util = require('util');
const db = require('../config/db');

// ทำให้ db.query ใช้กับ async/await ได้
const query = util.promisify(db.query).bind(db);

// กำหนดฟิลด์ที่ปลอดภัยสำหรับดึงข้อมูล เพื่อหลีกเลี่ยงการส่งข้อมูลรหัสผ่าน
const SAFE_EMPLOYEE_FIELDS = `
    e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel, 
    e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, e.emp_status,
    j.jobpos_name
`;


const Employee = {
    getAll: async (options = {}) => {
        // *** เพิ่ม Debug Log ตรงนี้ เพื่อดู options ที่ได้รับทั้งหมด (Raw) ***
        console.log('Employee.getAll received options (raw):', options);

        // ดึงค่าออกมาเฉพาะที่จำเป็น (ไม่รวม sort และ order แล้ว)
        const {
            page = 1,
            limit = 10,
            jobpos_id = null,
            status = 'active', 
            search = ''
        } = options;

        // แปลงค่า page และ limit เป็น Integer
        const parsedPage = parseInt(page);
        const parsedLimit = parseInt(limit);

        // *** Debug Log ที่เกี่ยวข้องกับ sort/order ถูกลบออกไปแล้ว ***
        console.log('Parsed Page:', parsedPage, '| Parsed Limit:', parsedLimit);


        let params = [];
        let whereClauses = [];

        if (search) {
            whereClauses.push(`(e.emp_name LIKE ? OR j.jobpos_name LIKE ?)`);
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
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

        const countSql = `SELECT COUNT(e.emp_id) as total FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id ${whereSql}`;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / parsedLimit) || 1; 


        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            ${whereSql}
        `;

        // *** ลบ Logic การสร้าง ORDER BY แบบไดนามิกออกทั้งหมดแล้ว ***
        // กำหนดให้เรียงตาม emp_name ASC เสมอ
        dataSql += ` ORDER BY e.emp_name ASC`; 
        // *********************************************************

        const offset = (parsedPage - 1) * parsedLimit; 
        dataSql += ` LIMIT ? OFFSET ?`;
        params.push(parsedLimit, offset); 

        // เพิ่ม console.log ตรงนี้เพื่อดู SQL Query เต็มๆ ก่อนรัน
        console.log('Final SQL Query for getAll (after fixed ORDER BY):', dataSql); 
        console.log('SQL Params for getAll:', params);     

        const employees = await query(dataSql, params);

        return {
            data: employees,
            meta: { totalItems, totalPages, currentPage: parsedPage, itemsPerPage: parsedLimit }, 
        };
    },

    // *** ลบฟังก์ชัน getAllSorted ออก เพราะไม่ได้ถูกเรียกใช้แล้ว (หรือไม่ควรถูกเรียกใช้) ***
    /*
    getAllSorted: async (sortField, sortOrder, page = 1, limit = 10) => {
        const countSql = `SELECT COUNT(emp_id) as total FROM employee`;
        const [totalResult] = await query(countSql);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
        `;

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
        const employees = await query(dataSql, [parseInt(limit), parseInt(offset)]);

        return {
            data: employees,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },
    */
    // ***********************************************************************************

    getById: async (id) => {
        const sql = `
            SELECT 
                e.emp_id, e.emp_name, e.jobpos_id, e.emp_email, e.emp_tel, 
                e.emp_address, e.emp_pic, e.emp_birthday, e.emp_startwork, 
                j.jobpos_name
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.emp_id = ?
        `;
        const results = await query(sql, [id]);
        return results; 
    },
    
    create: async (data) => {
        const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday } = data;
        const existingEmployee = await query('SELECT emp_id FROM employee WHERE emp_email = ? OR emp_username = ?', [emp_email, emp_username]);
        if (existingEmployee.length > 0) {
            throw new Error('Email หรือ Username นี้มีผู้ใช้งานแล้ว');
        }

        const insertSql = `
            INSERT INTO employee
            (emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday, emp_startwork)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;
        const params = [emp_name, parseInt(jobpos_id), emp_email, emp_tel, emp_address, emp_username, emp_password, emp_pic, emp_birthday];
        
        const result = await query(insertSql, params);
        const newEmployeeId = result.insertId;
        const [newEmployeeData] = await Employee.getById(newEmployeeId);
        return newEmployeeData;
    },

    update: async (id, data) => {
        const { emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic } = data;
        const sql = `
            UPDATE employee
            SET emp_name = ?, jobpos_id = ?, emp_email = ?, emp_tel = ?, emp_address = ?, emp_pic = ?
            WHERE emp_id = ?
        `;
        const params = [emp_name, jobpos_id, emp_email, emp_tel, emp_address, emp_pic, id];
        await query(sql, params);

        return await Employee.getById(id);
    },

    delete: async (id) => {
        return await query('DELETE FROM employee WHERE emp_id = ?', [id]);
    },
    
    searchEmployees: async (searchTerm, sortField, sortOrder, page = 1, limit = 10) => {
        const searchPattern = `%${searchTerm}%`;
        
        const countSql = `
            SELECT COUNT(e.emp_id) as total
            FROM employee e JOIN jobpos j ON e.jobpos_id = j.jobpos_id 
            WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?`;

        const [totalResult] = await query(countSql, [searchPattern, searchPattern]);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        let dataSql = `
            SELECT ${SAFE_EMPLOYEE_FIELDS}
            FROM employee e
            JOIN jobpos j ON e.jobpos_id = j.jobpos_id
            WHERE e.emp_name LIKE ? OR j.jobpos_name LIKE ?
        `;

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
        
        const employees = await query(dataSql, [searchPattern, searchPattern, parseInt(limit), parseInt(offset)]);

        return {
            data: employees,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },

    getByJobposId: async (jobposId) => {
    const sql = `
        SELECT ${SAFE_EMPLOYEE_FIELDS}
        FROM employee e
        JOIN jobpos j ON e.jobpos_id = j.jobpos_id
        WHERE e.jobpos_id = ?
    `;
    return await query(sql, [jobposId]);
},
};

module.exports = Employee;