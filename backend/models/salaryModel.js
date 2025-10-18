// backend/models/salaryModel.js
// Model สำหรับจัดการข้อมูลเงินเดือน (Salary) และการคำนวณเงินเดือนสุทธิ

const query = require('../utils/db'); // ใช้ db utility ที่รวมศูนย์

// Query หลักสำหรับดึงข้อมูลเงินเดือน พร้อม JOIN ตาราง employee, jobpos, salary และ about
// หมายเหตุ: ไม่มี WHERE / ORDER / LIMIT — จะถูกเพิ่มในแต่ละฟังก์ชัน
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
        COALESCE(a.startwork, '08:00:00') AS startwork,
        COALESCE(a.about_late, 0) AS about_late,
        COALESCE(a.late_allowed_count, 0) AS late_allowed_count,
        COALESCE(a.late_deduction_amount, 0.00) AS late_deduction_amount,
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
    LEFT JOIN about a ON e.company_id = a.company_id
`;

const SalaryModel = {
    // [ADMIN] ดึงข้อมูลเงินเดือนทั้งหมด พร้อมคำนวณค่าหักสายและเงินเดือนสุทธิ
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

        // นับจำนวนพนักงานทั้งหมด (ใช้ DISTINCT ป้องกันข้อมูลซ้ำ)
        const countSql = `
            SELECT COUNT(DISTINCT e.emp_id) AS total
            FROM employee e
            JOIN jobpos jp ON e.jobpos_id = jp.jobpos_id
            ${whereSql}
        `;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // คอลัมน์ที่อนุญาตให้เรียงลำดับ
        const sortableColumns = {
            emp_name: 'e.emp_name',
            jobpos_name: 'jp.jobpos_name',
            salary_base: 'salary_base',
            total_salary: 'total_salary',
            jobpos_id: 'e.jobpos_id'
        };
        const sortColumn = sortableColumns[sort] || 'e.emp_name';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        const offset = (page - 1) * limit;

        // ดึงข้อมูลพนักงานพร้อม JOIN salary + about เพื่อใช้คำนวณเงินเดือนสุทธิ
        const dataSql = `
            ${SALARY_QUERY_FIELDS_COMPREHENSIVE}
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const salaries = await query(dataSql, finalParams);

        // คำนวณยอดหักและเงินเดือนสุทธิ
        const processedSalaries = salaries.map(s => {
            const base = parseFloat(s.salary_base) || 0;
            const allowance = parseFloat(s.salary_allowance) || 0;
            const bonus = parseFloat(s.salary_bonus) || 0;
            const ot = parseFloat(s.salary_ot) || 0;
            const manualDeduction = parseFloat(s.salary_deduction) || 0;

            let lateDeduction = 0;
            if (s.late_deduction_amount > 0 && s.monthly_late_count > s.late_allowed_count) {
                const punishableLates = s.monthly_late_count - s.late_allowed_count;
                lateDeduction = punishableLates * s.late_deduction_amount;
            }

            const totalIncome = base + allowance + bonus + ot;
            const totalDeduction = manualDeduction + lateDeduction;
            const netSalary = totalIncome - totalDeduction;

            return {
                ...s,
                salary_deduction: totalDeduction.toFixed(2), // ยอดหักรวม (manual + late)
                total_salary: netSalary.toFixed(2) // เงินเดือนสุทธิ
            };
        });

        return {
            data: processedSalaries,
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            }
        };
    },

    // [ADMIN/USER] ดึงข้อมูลเงินเดือนรายบุคคล พร้อมคำนวณเงินเดือนสุทธิ
    getSalaryByEmpId: async (empId, companyId) => {
        const sql = `
            ${SALARY_QUERY_FIELDS_COMPREHENSIVE}
            WHERE e.emp_id = ? AND e.company_id = ?
            LIMIT 1
        `;
        const results = await query(sql, [empId, companyId]);
        const salaryInfo = results[0] || null;
        if (!salaryInfo) return null;

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
            salary_deduction: totalDeduction.toFixed(2),
            total_salary: netSalary.toFixed(2)
        };
    },

    // [ADMIN] อัปเดตข้อมูลเงินเดือนพื้นฐานของพนักงาน (INSERT หรือ UPDATE)
    updateSalary: async (empId, data, companyId) => {
        const sql = `
            INSERT INTO salary
            (emp_id, salary_base, salary_allowance, salary_bonus, salary_ot,
             salary_deduction, company_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                salary_base = VALUES(salary_base),
                salary_allowance = VALUES(salary_allowance),
                salary_bonus = VALUES(salary_bonus),
                salary_ot = VALUES(salary_ot),
                salary_deduction = VALUES(salary_deduction)
        `;
        const values = [
            empId,
            data.salary_base,
            data.salary_allowance,
            data.salary_bonus,
            data.salary_ot,
            data.salary_deduction,
            companyId
        ];
        await query(sql, values);

        // ดึงข้อมูลเงินเดือนหลังอัปเดตกลับไป
        return await SalaryModel.getSalaryByEmpId(empId, companyId);
    }
};

module.exports = SalaryModel;
