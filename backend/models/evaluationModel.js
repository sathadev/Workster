const query = require('../utils/db'); 

// --- ฟังก์ชัน helper ที่แยกออกมา ---
const getById = async (id, companyId) => {
    const sql = `SELECT * FROM evaluatework WHERE evaluatework_id = ? AND company_id = ?`;
    const results = await query(sql, [id, companyId]);
    return results[0] || null;
};

// --- สร้าง Object หลักสำหรับ Export ---
const Evaluation = {
    // ดึงประวัติการประเมินทั้งหมด (พร้อม Search, Sort, Filter, Pagination)
    getAllEvaluations: async (options = {}, companyId) => { // <--- รับ options และ companyId
        const { 
            search = '', 
            year = '', 
            sort = 'create_at', // Default sort key
            order = 'desc',    // Default sort order
            page = 1, 
            limit = 10 
        } = options;

        let params = [companyId]; // เริ่มต้นด้วย companyId
        let whereClauses = ['e.company_id = ?']; // กรองตามบริษัทเสมอ

        // 1. Search (ค้นหาตามชื่อพนักงาน)
        if (search) {
            whereClauses.push(`emp.emp_name LIKE ?`);
            params.push(`%${search}%`);
        }

        // 2. Filter (กรองตามปีที่ประเมิน)
        if (year) {
            whereClauses.push(`YEAR(e.create_at) = ?`);
            params.push(parseInt(year));
        }

        // สร้าง WHERE clause จากเงื่อนไขทั้งหมด
        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // SQL สำหรับนับจำนวนทั้งหมด (สำหรับ Pagination)
        const countSql = `
            SELECT COUNT(e.evaluatework_id) as total
            FROM evaluatework e
            JOIN employee emp ON e.emp_id = emp.emp_id
            ${whereSql}
        `;
        console.log('getAllEvaluations Count SQL:', countSql); // Debug Log
        console.log('getAllEvaluations Count Params:', params); // Debug Log
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // SQL สำหรับดึงข้อมูลจริง
        const sortableColumns = {
            create_at: 'e.create_at',
            emp_name: 'emp.emp_name',
            evaluatework_totalscore: 'e.evaluatework_totalscore'
        };
        const sortColumn = sortableColumns[sort] || 'e.create_at';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const dataSql = `
            SELECT e.evaluatework_id, e.create_at, emp.emp_name, e.evaluatework_totalscore, emp.emp_id
            FROM evaluatework e
            JOIN employee emp ON e.emp_id = emp.emp_id
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        
        const offset = (page - 1) * limit;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        console.log('getAllEvaluations Data SQL:', dataSql); // Debug Log
        console.log('getAllEvaluations Data Params:', finalParams); // Debug Log
        const evaluations = await query(dataSql, finalParams);

        return {
            data: evaluations,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },

    // ฟังก์ชันใหม่สำหรับดึงปีทั้งหมดที่มีข้อมูลการประเมิน
    getAllEvaluationYears: async (companyId) => {
        const sql = `
            SELECT DISTINCT YEAR(create_at) as year
            FROM evaluatework
            WHERE company_id = ? AND create_at IS NOT NULL
            ORDER BY year DESC
        `;
        console.log('getAllEvaluationYears SQL:', sql); // Debug Log
        console.log('getAllEvaluationYears Params:', [companyId]); // Debug Log
        const results = await query(sql, [companyId]);
        return results.map(row => String(row.year));
    },

    saveEvaluation: async (data, companyId) => {
        const sql = `
            INSERT INTO evaluatework
            (emp_id, evaluatework_score1, evaluatework_score2, evaluatework_score3, evaluatework_score4, evaluatework_score5, evaluatework_totalscore, create_at, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;
        const totalScore = [data.q1, data.q2, data.q3, data.q4, data.q5].reduce((sum, score) => sum + score, 0);
        const params = [data.emp_id, data.q1, data.q2, data.q3, data.q4, data.q5, totalScore, companyId];

        const result = await query(sql, params);
        
        return await getById(result.insertId, companyId);
    },

    getByEmployeeId: async (emp_id, companyId) => {
        const sql = `
            SELECT * FROM evaluatework
            WHERE emp_id = ? AND company_id = ?
            ORDER BY create_at DESC
        `;
        return await query(sql, [emp_id, companyId]);
    },
    
    getById: getById
};

module.exports = Evaluation;
