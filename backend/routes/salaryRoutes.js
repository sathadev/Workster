// backend/routes/salaryRoutes.js
// Route สำหรับจัดการข้อมูลเงินเดือน (Salary Management)
// ใช้สำหรับทั้งพนักงาน (ดูเงินเดือนตนเอง) และ HR/Admin (ดู/แก้ไข/ประมวลผลเงินเดือน)

const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');

// ใช้ในส่วน Payroll Service สำหรับการประมวลผลการหักเงินมาสาย
const PayrollService = require('../services/payrollService');
const db = require('../config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);

// [GET] /api/v1/salaries/me
// พนักงานดูข้อมูลเงินเดือนของตนเอง (ต้องล็อกอินก่อน)
router.get('/me', protect, salaryController.getMySalary);

// [GET] /api/v1/salaries
// HR/Admin ดึงข้อมูลเงินเดือนของพนักงานทั้งหมดในบริษัท
router.get('/', protect, salaryController.getAllSalaries);

// [PUT] /api/v1/salaries/:empId
// HR/Admin อัปเดตข้อมูลเงินเดือนของพนักงานรายคน
router.put('/:empId', protect, salaryController.updateSalary);

// [GET] /api/v1/salaries/:empId
// HR/Admin ดูรายละเอียดเงินเดือนของพนักงานรายคน
router.get('/:empId', protect, salaryController.getSalaryByEmpId);

// [POST] /api/v1/salaries/process-payroll
// HR/Admin สั่งประมวลผลการหักเงินจากการมาสายของพนักงานทั้งหมดในรอบบิล
// รับ body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
router.post('/process-payroll', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const { company_id: companyId } = req.user;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'กรุณาระบุวันที่เริ่มและสิ้นสุดรอบบิล' });
        }

        // ดึงพนักงานที่ยังทำงานอยู่ในบริษัท
        const employees = await query(
            "SELECT emp_id FROM employee WHERE company_id = ? AND emp_status = 'active'",
            [companyId]
        );

        if (employees.length === 0) {
            return res.status(200).json({ message: 'ไม่พบข้อมูลพนักงานสำหรับประมวลผล' });
        }

        let totalProcessedCount = 0;
        let errors = [];

        // วนลูปคำนวณและบันทึกค่าหักเงินมาสายของแต่ละคน
        for (const emp of employees) {
            try {
                const { deductionAmount, notes } = await PayrollService.calculateLateDeduction(
                    emp.emp_id,
                    companyId,
                    startDate,
                    endDate
                );

                if (deductionAmount > 0) {
                    // ลบข้อมูล log เดิมในรอบบิลนั้น (กันข้อมูลซ้ำ)
                    await query(
                        `DELETE FROM deduction_logs 
                         WHERE emp_id = ? 
                         AND deduction_type = 'late_count_exceeded' 
                         AND deduction_date BETWEEN ? AND ?`,
                        [emp.emp_id, startDate, endDate]
                    );

                    const logData = {
                        emp_id: emp.emp_id,
                        company_id: companyId,
                        deduction_date: new Date(endDate),
                        deduction_amount: deductionAmount,
                        deduction_type: 'late_count_exceeded',
                        notes: notes
                    };
                    await query('INSERT INTO deduction_logs SET ?', logData);
                    totalProcessedCount++;
                }
            } catch (loopError) {
                console.error(`Error processing payroll for emp_id ${emp.emp_id}:`, loopError);
                errors.push(`เกิดข้อผิดพลาดกับพนักงาน ID: ${emp.emp_id}`);
            }
        }

        res.status(200).json({
            message: `ประมวลผลการหักเงินมาสายสำเร็จ ${totalProcessedCount} รายการ`,
            errors
        });
    } catch (err) {
        console.error("API Error [process-payroll]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดร้ายแรงในการประมวลผลเงินเดือน' });
    }
});

module.exports = router;
