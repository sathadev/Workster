const util = require('util');
const db = require('../config/db');
const SalaryModel = require('../models/salaryModel');

const query = util.promisify(db.query).bind(db);

/**
 * Helper Function อัจฉริยะสำหรับคำนวณเงินเดือน (เวอร์ชันป้องกัน Error)
 * จะถูกเรียกใช้โดยทุกฟังก์ชันที่เกี่ยวข้อง
 */
const calculateSalaryDetails = async (empId, companyId) => {
    try {
        // 1. ดึงข้อมูลเงินเดือน ถ้าไม่มี ให้หยุดทำงานสำหรับพนักงานคนนี้
        const salaryInfo = await SalaryModel.getSalaryByEmpId(empId, companyId);
        if (!salaryInfo) {
            return null; 
        }

        // 2. ดึงกฎของบริษัท พร้อมค่า Default ป้องกัน Error
        const settingsResults = await query('SELECT * FROM about WHERE company_id = ? LIMIT 1', [companyId]);
        const settings = settingsResults[0] || {}; // ใช้ object ว่างเป็นค่าเริ่มต้น
        
        // กำหนดค่าเริ่มต้นสำหรับทุกการตั้งค่าที่จำเป็น
        const startWorkTime = settings.startwork || '08:00:00';
        const lateGraceMinutes = Number(settings.about_late) || 0;
        const allowedLates = Number(settings.late_allowed_count) || 0;
        const deductionAmountPerLate = parseFloat(settings.late_deduction_amount) || 0;

        // 3. คำนวณการหักเงินจากการมาสาย (เฉพาะเมื่อมีการตั้งค่าค่าปรับ)
        let lateDeduction = 0;
        if (deductionAmountPerLate > 0) {
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);
            
            const checkinRecords = await query(
                `SELECT attendance_datetime FROM attendance 
                 WHERE emp_id = ? AND company_id = ? AND attendance_type = 'checkin' 
                 AND DATE(attendance_datetime) BETWEEN ? AND ?`,
                [empId, companyId, firstDay, lastDay]
            );

            // คำนวณหาเวลาสิ้นสุดที่ยังถือว่าไม่สาย
            const [hours, minutes] = startWorkTime.split(':');
            const gracePeriodTime = new Date();
            gracePeriodTime.setHours(Number(hours), Number(minutes) + lateGraceMinutes, 0, 0);

            let actualLateCount = 0;
            // ตรวจสอบก่อนว่าเวลาที่คำนวณได้ไม่ผิดพลาด
            if (!isNaN(gracePeriodTime.getTime())) { 
                for (const record of checkinRecords) {
                    const checkinTime = new Date(record.attendance_datetime);
                    
                    // สร้าง Date Object ของเวลาที่เช็คอิน เพื่อเปรียบเทียบเฉพาะส่วนของเวลา
                    const recordTime = new Date();
                    recordTime.setHours(checkinTime.getHours(), checkinTime.getMinutes(), checkinTime.getSeconds(), 0);

                    if (recordTime > gracePeriodTime) {
                        actualLateCount++;
                    }
                }
            }

            // คำนวณค่าปรับ
            const punishableLates = Math.max(0, actualLateCount - allowedLates);
            lateDeduction = punishableLates * deductionAmountPerLate;
        }

        // 4. คำนวณยอดรวมทั้งหมด (ใช้ค่าเริ่มต้น 0 หากเป็น null)
        const base = parseFloat(salaryInfo.salary_base) || 0;
        const allowance = parseFloat(salaryInfo.salary_allowance) || 0;
        const bonus = parseFloat(salaryInfo.salary_bonus) || 0;
        const ot = parseFloat(salaryInfo.salary_ot) || 0;
        const manualDeduction = parseFloat(salaryInfo.salary_deduction) || 0;

        const totalIncome = base + allowance + bonus + ot;
        const totalDeduction = manualDeduction + lateDeduction;
        const netSalary = totalIncome - totalDeduction;

        // 5. คืนค่า Object ที่คำนวณสมบูรณ์แล้ว
        return {
            ...salaryInfo,
            salary_deduction: totalDeduction.toFixed(2), // Override ด้วยยอดหักใหม่ทั้งหมด
            total_salary: netSalary.toFixed(2),         // Override ด้วยเงินเดือนสุทธิใหม่
        };

    } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการคำนวณเงินเดือนของพนักงาน ID ${empId}:`, error);
        // หากเกิด Error, พยายามส่งข้อมูลดิบกลับไปก่อน เพื่อไม่ให้หน้าเว็บล่ม
        try {
            return await SalaryModel.getSalaryByEmpId(empId, companyId);
        } catch (fallbackError) {
            return null; // ถ้าดึงข้อมูลดิบยังไม่ได้ ก็ยอมแพ้
        }
    }
};


// [GET] /api/v1/salaries/me - ดูข้อมูลเงินเดือนของตนเอง
exports.getMySalary = async (req, res) => {
    const { emp_id } = req.user;
    const { company_id } = req.user; // ควรมาจาก Middleware

    const salaryDetails = await calculateSalaryDetails(emp_id, company_id);

    if (!salaryDetails) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของคุณ' });
    }
    res.status(200).json(salaryDetails);
};

// [GET] /api/v1/salaries - ดึงข้อมูลเงินเดือนทั้งหมด (สำหรับ Admin)
exports.getAllSalaries = async (req, res) => {
    try {
        const companyId = req.companyId; // ควรมาจาก Middleware
        
        // 1. ดึงข้อมูลพนักงานและเงินเดือนพื้นฐานพร้อมกับการแบ่งหน้า/ค้นหา
        const { data: salaries, meta } = await SalaryModel.getAll(req.query, companyId);
        if (!salaries || salaries.length === 0) {
            return res.status(200).json({ data: [], meta: {} });
        }

        // 2. คำนวณรายละเอียดเงินเดือนสำหรับพนักงานแต่ละคนที่แสดงในหน้านั้นๆ
        const processedSalaries = await Promise.all(
            salaries.map(emp => calculateSalaryDetails(emp.emp_id, companyId))
        );

        res.status(200).json({
            data: processedSalaries.filter(p => p), // กรองพนักงานที่ไม่มีข้อมูลเงินเดือนออก
            meta: meta
        });
    } catch (err) {
        console.error("API Error [getAllSalaries]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน" });
    }
};

// [GET] /api/v1/salaries/:empId
exports.getSalaryByEmpId = async (req, res) => {
    const { empId } = req.params;
    const companyId = req.companyId; // ควรมาจาก Middleware

    const salaryDetails = await calculateSalaryDetails(empId, companyId);

    if (!salaryDetails) {
        return res.status(404).json({ message: 'ไม่พบข้อมูลเงินเดือนของพนักงานนี้' });
    }
    res.status(200).json(salaryDetails);
};

// [PUT] /api/v1/salaries/:empId - อัปเดตข้อมูลเงินเดือน (สำหรับ Admin)
exports.updateSalary = async (req, res) => {
    try {
        const { empId } = req.params;
        const salaryData = req.body;
        const companyId = req.companyId; 
        
        const updatedSalary = await SalaryModel.updateSalary(empId, salaryData, companyId);
        
        // หลังอัปเดต, ดึงข้อมูลที่คำนวณแล้วส่งกลับไป
        const finalDetails = await calculateSalaryDetails(empId, companyId);
        
        res.status(200).json(finalDetails);
    } catch (err) {
        res.status(500).json({ message: "อัปเดตข้อมูลเงินเดือนไม่สำเร็จ" });
    }
};
