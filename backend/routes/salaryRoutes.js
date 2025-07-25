const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');

// --- เพิ่ม import ที่จำเป็น ---
const PayrollService = require('../services/payrollService');
const db = require('../config/db');
const util = require('util');
const query = util.promisify(db.query).bind(db);
// ----------------------------


// === ROUTES เดิม (สำหรับ Admin/HR และพนักงาน) ===

// GET /api/v1/salaries/me - พนักงานดูเงินเดือนของตัวเอง
router.get('/me', protect, salaryController.getMySalary);

// GET /api/v1/salaries - Admin ดึงข้อมูลเงินเดือนทั้งหมด
router.get('/', protect, salaryController.getAllSalaries);

// PUT /api/v1/salaries/:empId - Admin อัปเดตข้อมูลเงินเดือน
router.put('/:empId', protect, salaryController.updateSalary);

// GET /api/v1/salaries/:empId - Admin ดูข้อมูลเงินเดือนของพนักงานรายคน
router.get('/:empId', protect, salaryController.getSalaryByEmpId);


// === ROUTE ใหม่ (สำหรับประมวลผลเงินเดือน) ===

/**
 * [POST] /api/v1/salaries/process-payroll
 * Route สำหรับให้ Admin สั่งประมวลผลการหักเงินจากการมาสายของพนักงานทุกคนในรอบบิล
 * รับ body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
 */
router.post('/process-payroll', protect, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        // ดึง companyId จาก middleware protect ที่แนบข้อมูล user มากับ request
        const { company_id: companyId } = req.user;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'กรุณาระบุวันที่เริ่มและสิ้นสุดรอบบิล' });
        }

        // 1. ดึง ID ของพนักงานที่ยังทำงานอยู่ (active) ทั้งหมดในบริษัท
        const employees = await query(
            "SELECT emp_id FROM employee WHERE company_id = ? AND emp_status = 'active'", 
            [companyId]
        );

        if (employees.length === 0) {
            return res.status(200).json({ message: 'ไม่พบข้อมูลพนักงานสำหรับประมวลผล' });
        }

        let totalProcessedCount = 0;
        let errors = [];

        // 2. วนลูปพนักงานแต่ละคนเพื่อคำนวณและบันทึกการหักเงิน
        for (const emp of employees) {
            try {
                // เรียกใช้ Service เพื่อคำนวณ
                const { deductionAmount, notes } = await PayrollService.calculateLateDeduction(emp.emp_id, companyId, startDate, endDate);

                // 3. ถ้ามีจำนวนเงินที่ต้องหัก ให้บันทึกลงในตาราง `deduction_logs`
                if (deductionAmount > 0) {
                    // ก่อนบันทึก อาจจะลบ log เก่าของรอบบิลนี้ออกก่อน เพื่อป้องกันการกดซ้ำ
                    await query(
                        `DELETE FROM deduction_logs WHERE emp_id = ? AND deduction_type = 'late_count_exceeded' AND deduction_date BETWEEN ? AND ?`,
                        [emp.emp_id, startDate, endDate]
                    );

                    const logData = {
                        emp_id: emp.emp_id,
                        company_id: companyId,
                        deduction_date: new Date(endDate), // ใช้วันสุดท้ายของรอบบิลเป็นวันที่หักเงิน
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

        // 4. ส่งผลลัพธ์กลับไป
        res.status(200).json({
            message: `ประมวลผลการหักเงินมาสายสำเร็จ ${totalProcessedCount} รายการ`,
            errors: errors
        });

    } catch (err) {
        console.error("API Error [process-payroll]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดร้ายแรงในการประมวลผลเงินเดือน' });
    }
});


module.exports = router;