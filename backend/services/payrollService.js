// backend/services/payrollService.js
const util = require('util');
const db = require('../config/db'); // ตรวจสอบว่า path ไปยังไฟล์ db config ถูกต้อง

const query = util.promisify(db.query).bind(db);

const PayrollService = {

    /**
     * คำนวณเงินหักจากการมาสายเกินจำนวนครั้งที่บริษัทกำหนด
     * @param {number} empId - ID ของพนักงาน
     * @param {number} companyId - ID ของบริษัท
     * @param {string} startDate - วันที่เริ่มรอบบิล (รูปแบบ: YYYY-MM-DD)
     * @param {string} endDate - วันที่สิ้นสุดรอบบิล (รูปแบบ: YYYY-MM-DD)
     * @returns {Promise<{deductionAmount: number, notes: string}>} - Object ที่มีจำนวนเงินที่หักและรายละเอียด
     */
    async calculateLateDeduction(empId, companyId, startDate, endDate) {
        try {
            // 1. ดึงข้อมูลการตั้งค่าของบริษัท (กฎการมาสาย)
            const settingsSql = 'SELECT late_allowed_count, late_deduction_amount FROM about WHERE company_id = ? LIMIT 1';
            const [settings] = await query(settingsSql, [companyId]);

            // ตรวจสอบว่ามีกฎการหักเงินหรือไม่ ถ้าไม่มีก็ไม่ต้องทำต่อ
            if (!settings || !settings.late_allowed_count || !settings.late_deduction_amount || settings.late_deduction_amount <= 0) {
                return { deductionAmount: 0, notes: '' };
            }

            // 2. นับจำนวนครั้งที่พนักงานมาสายจริงๆ ในช่วงวันที่กำหนด
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

            const lateCount = lateRecords.late_count || 0;
            
            // 3. เปรียบเทียบจำนวนครั้งที่มาสายกับที่อนุโลม แล้วคำนวณเงินที่ต้องหัก
            let totalDeduction = 0;
            let notes = '';

            if (lateCount > settings.late_allowed_count) {
                const punishableLates = lateCount - settings.late_allowed_count; // จำนวนครั้งที่สายและต้องถูกลงโทษ
                totalDeduction = punishableLates * settings.late_deduction_amount;
                notes = `หักเงินมาสายเกินกำหนด ${punishableLates} ครั้ง (มาสายทั้งหมด ${lateCount} ครั้ง)`;
            }

            return {
                deductionAmount: parseFloat(totalDeduction.toFixed(2)),
                notes: notes
            };

        } catch (error) {
            console.error(`Error calculating late deduction for emp_id ${empId}:`, error);
            // ในกรณีที่เกิดข้อผิดพลาด ให้คืนค่าเป็น 0 เพื่อไม่ให้กระทบการคำนวณเงินเดือนโดยรวม
            return { deductionAmount: 0, notes: 'Error during calculation' };
        }
    }
};

module.exports = PayrollService;
