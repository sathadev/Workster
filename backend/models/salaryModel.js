// backend/models/salaryModel.js
const query = require('../utils/db'); // ใช้ db utility ที่รวมศูนย์

// SQL สำหรับดึงข้อมูลเงินเดือนพร้อม JOIN ตารางที่เกี่ยวข้อง
// *** สำคัญ: ไม่มี WHERE, ORDER BY, LIMIT/OFFSET หรือ GROUP BY ในส่วนนี้ ***
// ส่วนเหล่านั้นจะถูกเพิ่มเข้ามาในฟังก์ชัน getAll หรือ getSalaryByEmpId
const SALARY_QUERY_FIELDS_COMPREHENSIVE = `
    SELECT
        e.emp_id,
        e.emp_name,
        e.emp_status,
        jp.jobpos_name,
        COALESCE(s.salary_base, 0) AS salary_base,
        COALESCE(s.salary_allowance, 0) AS salary_allowance,
        COALESCE(s.salary_bonus, 0) AS salary_bonus,
        COALESCE(s.salary_ot, 0) AS salary_ot,
        COALESCE(s.salary_deduction, 0) AS salary_deduction,
        -- ดึงค่าจากตาราง about
        COALESCE(a.startwork, '08:00:00') AS startwork,
        COALESCE(a.about_late, 0) AS about_late,
        COALESCE(a.late_allowed_count, 0) AS late_allowed_count,
        COALESCE(a.late_deduction_amount, 0.00) AS late_deduction_amount,
        -- นับจำนวนการมาสายในเดือนปัจจุบัน (สำหรับพนักงานแต่ละคน)
        -- ใช้ Subquery เพื่อให้แน่ใจว่านับเฉพาะของพนักงานคนนั้นและเดือนปัจจุบัน
        (SELECT COUNT(*)
         FROM attendance sub_att
         WHERE sub_att.emp_id = e.emp_id
           AND sub_att.company_id = e.company_id
           AND sub_att.attendance_type = 'checkin'
           AND sub_att.attendance_status = 'late'
           AND DATE_FORMAT(sub_att.attendance_datetime, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
        ) AS monthly_late_count
    FROM employee e
    JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
    LEFT JOIN salary s ON e.emp_id = s.emp_id
    LEFT JOIN about a ON e.company_id = a.company_id -- Join กับตาราง about เพื่อดึงการตั้งค่าบริษัท
`;

const SalaryModel = {
    /**
     * ดึงข้อมูลเงินเดือนทั้งหมดพร้อมการคำนวณค่าปรับมาสายและเงินเดือนสุทธิ
     * รองรับการค้นหา, กรองตำแหน่ง, เรียงลำดับ และแบ่งหน้า
     * @param {object} options - อ็อพชันสำหรับ search, jobpos_id, sort, order, page, limit
     * @param {number} companyId - ID ของบริษัทที่ต้องการกรองข้อมูล
     * @returns {Promise<{data: Array, meta: object}>} - ข้อมูลเงินเดือนพร้อมข้อมูล meta สำหรับการแบ่งหน้า
     */
    getAll: async (options = {}, companyId) => {
        const {
            search = '',
            page = 1,
            limit = 10,
            sort = 'emp_name',
            order = 'asc',
            jobpos_id = null
        } = options;

        let params = [companyId];
        let whereClauses = [`e.emp_status = 'active'`, `e.company_id = ?`];

        if (search) {
            whereClauses.push(`(e.emp_name LIKE ? OR jp.jobpos_name LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`);
        }

        if (jobpos_id) {
            whereClauses.push(`e.jobpos_id = ?`);
            params.push(jobpos_id);
        }

        const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

        // 1. นับจำนวนทั้งหมด (สำหรับ Pagination)
        // เนื่องจากเราใช้ Subquery ใน SELECT list, การนับ COUNT(DISTINCT e.emp_id) จะแม่นยำกว่า
        const countSql = `
            SELECT COUNT(DISTINCT e.emp_id) as total
            FROM employee e
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            ${whereSql}
        `;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // กำหนดคอลัมน์ที่สามารถเรียงลำดับได้
        const sortableColumns = {
            emp_name: 'e.emp_name',
            jobpos_name: 'jp.jobpos_name',
            salary_base: 'salary_base', // ใช้ alias จาก SELECT
            total_salary: 'total_salary', // ใช้ alias จาก SELECT
            jobpos_id: 'e.jobpos_id'
        };
        const sortColumn = sortableColumns[sort] || 'e.emp_name';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const offset = (page - 1) * limit;

        // 2. ดึงข้อมูลจริงพร้อม pagination
        const dataSql = `
            ${SALARY_QUERY_FIELDS_COMPREHENSIVE}
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;

        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const salaries = await query(dataSql, finalParams);

        // คำนวณ total_salary และ lateDeduction ใน Model เลย
        const processedSalaries = salaries.map(s => {
            const base = parseFloat(s.salary_base) || 0;
            const allowance = parseFloat(s.salary_allowance) || 0;
            const bonus = parseFloat(s.salary_bonus) || 0;
            const ot = parseFloat(s.salary_ot) || 0;
            const manualDeduction = parseFloat(s.salary_deduction) || 0;

            let lateDeduction = 0;
            // ตรวจสอบว่ามีการตั้งค่าการหักเงินมาสาย และจำนวนครั้งที่สายเกินโควต้า
            if (s.late_deduction_amount > 0 && s.monthly_late_count > s.late_allowed_count) {
                const punishableLates = s.monthly_late_count - s.late_allowed_count;
                lateDeduction = punishableLates * s.late_deduction_amount;
            }

            const totalIncome = base + allowance + bonus + ot;
            const totalDeduction = manualDeduction + lateDeduction;
            const netSalary = totalIncome - totalDeduction;

            return {
                ...s,
                salary_deduction: totalDeduction.toFixed(2), // ยอดหักรวมทั้งหมด (manual + late)
                total_salary: netSalary.toFixed(2), // เงินเดือนสุทธิที่คำนวณแล้ว
            };
        });

        return {
            data: processedSalaries, // ส่งข้อมูลที่คำนวณแล้วกลับไป
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        };
    },

    /**
     * ดึงข้อมูลเงินเดือนของพนักงานรายบุคคลพร้อมการคำนวณค่าปรับมาสายและเงินเดือนสุทธิ
     * @param {number} empId - ID ของพนักงาน
     * @param {number} companyId - ID ของบริษัท
     * @returns {Promise<object|null>} - ข้อมูลเงินเดือนที่คำนวณแล้ว หรือ null ถ้าไม่พบ
     */
    getSalaryByEmpId: async (empId, companyId) => {
        // ใช้ SALARY_QUERY_FIELDS_COMPREHENSIVE และเพิ่ม WHERE clause
        const sql = `
            ${SALARY_QUERY_FIELDS_COMPREHENSIVE}
            WHERE e.emp_id = ? AND e.company_id = ?
            LIMIT 1 -- เนื่องจากดึงแค่คนเดียว
        `;
        const results = await query(sql, [empId, companyId]);
        const salaryInfo = results[0] || null;

        if (!salaryInfo) return null;

        // คำนวณค่าหักและเงินเดือนสุทธิใน Model เลย
        const base = parseFloat(salaryInfo.salary_base) || 0;
        const allowance = parseFloat(salaryInfo.salary_allowance) || 0;
        const bonus = parseFloat(salaryInfo.salary_bonus) || 0;
        const ot = parseFloat(salaryInfo.salary_ot) || 0;
        const manualDeduction = parseFloat(salaryInfo.salary_deduction) || 0;

        let lateDeduction = 0;
        if (salaryInfo.late_deduction_amount > 0 && salaryInfo.monthly_late_count > salaryInfo.late_allowed_count) {
            const punishableLates = salaryInfo.monthly_late_count - salaryInfo.late_allowed_count;
            lateDeduction = punishableLates * salaryInfo.late_deduction_amount;
        }

        const totalIncome = base + allowance + bonus + ot;
        const totalDeduction = manualDeduction + lateDeduction;
        const netSalary = totalIncome - totalDeduction;

        return {
            ...salaryInfo,
            salary_deduction: totalDeduction.toFixed(2), // ยอดหักรวมทั้งหมด
            total_salary: netSalary.toFixed(2), // เงินเดือนสุทธิที่คำนวณแล้ว
        };
    },

    /**
     * อัปเดตข้อมูลเงินเดือนพื้นฐานของพนักงาน
     * @param {number} empId - ID ของพนักงาน
     * @param {object} data - ข้อมูลเงินเดือนที่จะอัปเดต (salary_base, salary_allowance, etc.)
     * @param {number} companyId - ID ของบริษัท
     * @returns {Promise<object|null>} - ข้อมูลเงินเดือนที่คำนวณแล้วหลังการอัปเดต
     */
    updateSalary: async (empId, data, companyId) => {
        const sql = `
            INSERT INTO salary
            (emp_id, salary_base, salary_allowance, salary_bonus, salary_ot,
            salary_deduction, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                salary_base = VALUES(salary_base), salary_allowance = VALUES(salary_allowance),
                salary_bonus = VALUES(salary_bonus), salary_ot = VALUES(salary_ot),
                salary_deduction = VALUES(salary_deduction)
        `;
        const values = [empId,
            data.salary_base, data.salary_allowance, data.salary_bonus, data.salary_ot,
            data.salary_deduction, companyId
        ];
        await query(sql, values);

        // ดึงข้อมูลที่คำนวณแล้วส่งกลับไปหลังการอัปเดต
        return await SalaryModel.getSalaryByEmpId(empId, companyId);
    },
};

module.exports = SalaryModel;
