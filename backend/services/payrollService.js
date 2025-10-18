// backend/services/payrollService.js
// -----------------------------------------------------------------------------
// Service Layer: PayrollService
// หน้าที่: จัดการตรรกะการคำนวณค่าปรับกรณีพนักงานมาสาย
// ใช้ในระบบคำนวณเงินเดือน (Payroll Processing)
// -----------------------------------------------------------------------------

const query = require('../utils/db'); // ใช้ฟังก์ชัน query สำหรับเชื่อมต่อฐานข้อมูล (รองรับ async/await)

const PayrollService = {

    // ฟังก์ชันหลัก: calculateLateDeduction
    // หน้าที่: คำนวณจำนวนเงินที่ต้องหักจากพนักงานที่มาสายเกินกว่าจำนวนที่บริษัทอนุโลม
    // พารามิเตอร์:
    // - empId: รหัสพนักงาน
    // - companyId: รหัสบริษัท
    // - startDate: วันที่เริ่มรอบบิล (YYYY-MM-DD)
    // - endDate: วันที่สิ้นสุดรอบบิล (YYYY-MM-DD)
    // คืนค่า: Object { deductionAmount: number, notes: string }
    async calculateLateDeduction(empId, companyId, startDate, endDate) {
        try {
            // 1. ดึงข้อมูลกฎการมาสายของบริษัทจากตาราง about
            const settingsSql = `
                SELECT late_allowed_count, late_deduction_amount
                FROM about
                WHERE company_id = ?
                LIMIT 1
            `;
            const [settings] = await query(settingsSql, [companyId]);

            // ตรวจสอบว่ามีการตั้งค่าการหักเงินหรือไม่
            // ถ้าไม่มีข้อมูลหรือไม่กำหนดจำนวนเงินหัก จะคืนค่า 0 ทันที
            if (
                !settings ||
                !settings.late_allowed_count ||
                !settings.late_deduction_amount ||
                settings.late_deduction_amount <= 0
            ) {
                return { deductionAmount: 0, notes: '' };
            }

            // 2. ดึงจำนวนครั้งที่พนักงานมาสายในช่วงวันที่กำหนด
            const lateRecordsSql = `
                SELECT COUNT(*) as late_count
                FROM attendance
                WHERE emp_id = ?
                  AND company_id = ?
                  AND attendance_status = 'late'
                  AND attendance_type = 'checkin'
                  AND DATE(attendance_datetime) BETWEEN ? AND ?
            `;
            const [lateRecords] = await query(lateRecordsSql, [empId, companyId, startDate, endDate]);

            // ถ้าไม่มีข้อมูลมาสาย lateCount จะเท่ากับ 0
            const lateCount = lateRecords.late_count || 0;

            // 3. คำนวณจำนวนครั้งที่มาสายเกินอนุโลม และยอดเงินที่ต้องหัก
            let totalDeduction = 0;
            let notes = '';

            if (lateCount > settings.late_allowed_count) {
                // คำนวณจำนวนครั้งที่เกินจากโควต้า
                const punishableLates = lateCount - settings.late_allowed_count;
                // คำนวณยอดเงินที่ต้องหัก
                totalDeduction = punishableLates * settings.late_deduction_amount;
                // สร้างข้อความบันทึกรายละเอียด
                notes = `หักเงินมาสายเกินกำหนด ${punishableLates} ครั้ง (มาสายทั้งหมด ${lateCount} ครั้ง)`;
            }

            // 4. คืนค่าผลลัพธ์การคำนวณ
            return {
                deductionAmount: parseFloat(totalDeduction.toFixed(2)), // ปัดทศนิยม 2 ตำแหน่ง
                notes: notes
            };

        } catch (error) {
            // 5. กรณีเกิดข้อผิดพลาดระหว่างการคำนวณหรือดึงข้อมูล
            console.error(`Error calculating late deduction for emp_id ${empId}:`, error);

            // คืนค่าปลอดภัย (Safe Return) เพื่อไม่ให้ระบบ Payroll ล่ม
            return { deductionAmount: 0, notes: 'Error during calculation' };
        }
    }
};

module.exports = PayrollService;
