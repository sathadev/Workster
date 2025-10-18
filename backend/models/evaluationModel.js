// backend/models/evaluationModel.js
// Model สำหรับจัดการข้อมูลการประเมินผลพนักงาน (Employee Evaluation)
// เช่น ดึงข้อมูลการประเมินทั้งหมด, ดึงปีที่มีการประเมิน, เพิ่มผลการประเมิน, และค้นหารายบุคคล

const query = require('../utils/db'); // ใช้เชื่อมต่อฐานข้อมูล MySQL ด้วย async/await

// [Helper] ดึงข้อมูลการประเมินรายบุคคลตาม evaluatework_id และ company_id
const getById = async (id, companyId) => {
    const sql = `SELECT * FROM evaluatework WHERE evaluatework_id = ? AND company_id = ?`;
    const results = await query(sql, [id, companyId]);
    return results[0] || null;
};

const Evaluation = {

    // [GET] ดึงข้อมูลการประเมินทั้งหมด (พร้อมค้นหา, เรียงลำดับ, กรองปี, และแบ่งหน้า)
    getAllEvaluations: async (options = {}, companyId) => {
        const { 
            search = '', 
            year = '', 
            sort = 'create_at', // คีย์ที่ใช้เรียงลำดับเริ่มต้น
            order = 'desc',    // ทิศทางการเรียงลำดับเริ่มต้น
            page = 1, 
            limit = 10 
        } = options;

        let params = [companyId]; // เริ่มด้วย company_id
        let whereClauses = ['e.company_id = ?']; // ต้องกรองตามบริษัทเสมอ

        // 🔍 ค้นหาตามชื่อพนักงาน
        if (search) {
            whereClauses.push(`emp.emp_name LIKE ?`);
            params.push(`%${search}%`);
        }

        // 📅 กรองข้อมูลตามปีที่ประเมิน (เช่น 2024)
        if (year) {
            whereClauses.push(`YEAR(e.create_at) = ?`);
            params.push(parseInt(year));
        }

        // รวม WHERE ทั้งหมด
        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // Query สำหรับนับจำนวนทั้งหมด (ใช้คำนวณจำนวนหน้า)
        const countSql = `
            SELECT COUNT(e.evaluatework_id) as total
            FROM evaluatework e
            JOIN employee emp ON e.emp_id = emp.emp_id
            ${whereSql}
        `;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // กำหนดคอลัมน์ที่อนุญาตให้เรียง
        const sortableColumns = {
            create_at: 'e.create_at',
            emp_name: 'emp.emp_name',
            evaluatework_totalscore: 'e.evaluatework_totalscore'
        };
        const sortColumn = sortableColumns[sort] || 'e.create_at';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Query ดึงข้อมูลจริง พร้อม JOIN employee เพื่อโชว์ชื่อพนักงาน
        const dataSql = `
            SELECT 
                e.evaluatework_id, 
                e.create_at, 
                emp.emp_name, 
                e.evaluatework_totalscore, 
                emp.emp_id
            FROM evaluatework e
            JOIN employee emp ON e.emp_id = emp.emp_id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const evaluations = await query(dataSql, finalParams);

        // ส่งข้อมูลพร้อม metadata กลับไปให้ controller
        return {
            data: evaluations,
            meta: { 
                totalItems, 
                totalPages, 
                currentPage: parseInt(page), 
                itemsPerPage: parseInt(limit) 
            },
        };
    },

    // [GET] ดึงปีทั้งหมดที่มีข้อมูลการประเมิน (ใช้ในหน้า Filter ปี)
    getAllEvaluationYears: async (companyId) => {
        const sql = `
            SELECT DISTINCT YEAR(create_at) as year
            FROM evaluatework
            WHERE company_id = ? AND create_at IS NOT NULL
            ORDER BY year DESC
        `;
        const results = await query(sql, [companyId]);
        // แปลงผลลัพธ์เป็น array ของ string เช่น ['2025', '2024', '2023']
        return results.map(row => String(row.year));
    },

    // [POST] บันทึกผลการประเมินใหม่ลงฐานข้อมูล
    saveEvaluation: async (data, companyId) => {
        const sql = `
            INSERT INTO evaluatework
            (
                emp_id, 
                evaluatework_score1, 
                evaluatework_score2, 
                evaluatework_score3, 
                evaluatework_score4, 
                evaluatework_score5, 
                evaluatework_totalscore, 
                create_at, 
                company_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;

        // คำนวณคะแนนรวมจาก q1–q5
        const totalScore = [data.q1, data.q2, data.q3, data.q4, data.q5]
            .reduce((sum, score) => sum + score, 0);

        const params = [
            data.emp_id, data.q1, data.q2, data.q3, data.q4, data.q5,
            totalScore, companyId
        ];

        // บันทึกข้อมูลลงฐานข้อมูล
        const result = await query(sql, params);

        // ดึงข้อมูลที่เพิ่งบันทึกกลับไปให้ controller ใช้
        return await getById(result.insertId, companyId);
    },

    // [GET] ดึงประวัติการประเมินของพนักงานรายบุคคล (ตาม emp_id)
    getByEmployeeId: async (emp_id, companyId) => {
        const sql = `
            SELECT *
            FROM evaluatework
            WHERE emp_id = ? AND company_id = ?
            ORDER BY create_at DESC
        `;
        return await query(sql, [emp_id, companyId]);
    },

    // [GET] ดึงข้อมูลการประเมินรายชิ้นตาม evaluatework_id
    getById: getById
};

module.exports = Evaluation;
