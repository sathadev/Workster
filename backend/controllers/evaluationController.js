// backend/controllers/evaluationController.js
// Controller สำหรับจัดการข้อมูลการประเมินผลการทำงานของพนักงาน (Employee Evaluation)
// เช่น ดึงประวัติการประเมิน, เพิ่มผลการประเมิน, และดูรายละเอียดผลการประเมินรายคน

const Evaluation = require('../models/evaluationModel'); // Model สำหรับข้อมูลการประเมิน
const employeeModel = require('../models/employeeModel'); // Model สำหรับข้อมูลพนักงาน

// [GET] /api/v1/evaluations
// ดึงประวัติการประเมินทั้งหมดของบริษัท (พร้อม Filter หรือ Pagination ถ้ามี)
exports.getAllEvaluations = async (req, res) => {
    try {
        console.log('Controller: getAllEvaluations called with query:', req.query, 'and companyId:', req.companyId);
        const evaluations = await Evaluation.getAllEvaluations(req.query, req.companyId);
        res.status(200).json(evaluations);
    } catch (err) {
        console.error("API Error [getAllEvaluations]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการประเมิน' });
    }
};

// [GET] /api/v1/evaluations/years
// ดึงปีทั้งหมดที่มีข้อมูลการประเมินในระบบ (เช่น 2023, 2024, ...)
exports.getEvaluationYears = async (req, res) => {
    try {
        console.log('Controller: getEvaluationYears called with companyId:', req.companyId);
        const years = await Evaluation.getAllEvaluationYears(req.companyId);
        res.status(200).json(years);
    } catch (err) {
        console.error("API Error [getEvaluationYears]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลปีการประเมิน' });
    }
};

// [GET] /api/v1/evaluations/:id
// ดึงข้อมูลการประเมินรายบุคคลตาม evaluatework_id
exports.getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluation = await Evaluation.getById(id, req.companyId);

        if (!evaluation) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการประเมิน' });
        }

        res.status(200).json(evaluation);
    } catch (err) {
        console.error("API Error [getEvaluationById]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแสดงผล' });
    }
};

// [POST] /api/v1/evaluations
// บันทึกผลการประเมินใหม่ (เฉพาะสัปดาห์สุดท้ายของเดือนธันวาคมเท่านั้น)
exports.createEvaluation = async (req, res) => {
    try {
        // ตรวจสอบวันที่ปัจจุบัน ว่าสามารถทำการประเมินได้หรือไม่
        const today = new Date();
        const month = today.getMonth(); // เดือน (0-11)
        const date = today.getDate();   // วันที่ (1-31)

        // เงื่อนไข: อนุญาตให้ทำการประเมินเฉพาะวันที่ 25-31 ธันวาคม
        if (month !== 11 || date < 25) {
            return res.status(403).json({
                message: 'การประเมินผลสามารถทำได้เฉพาะสัปดาห์สุดท้ายของเดือนธันวาคมเท่านั้น'
            });
        }

        // รับข้อมูลการประเมินจาก req.body
        // ตัวอย่างข้อมูล: { emp_id: 4, q1: 5, q2: 4, q3: 5, q4: 4, q5: 5 }
        const evaluationData = {
            emp_id: parseInt(req.body.emp_id, 10),
            q1: parseInt(req.body.q1, 10),
            q2: parseInt(req.body.q2, 10),
            q3: parseInt(req.body.q3, 10),
            q4: parseInt(req.body.q4, 10),
            q5: parseInt(req.body.q5, 10)
        };

        // ตรวจสอบว่ามี emp_id ถูกส่งมาหรือไม่
        if (!evaluationData.emp_id) {
            return res.status(400).json({ message: 'ไม่พบรหัสพนักงาน' });
        }

        // บันทึกข้อมูลการประเมินลงฐานข้อมูล
        const newEvaluation = await Evaluation.saveEvaluation(evaluationData, req.companyId);
        res.status(201).json(newEvaluation);

    } catch (err) {
        console.error("API Error [createEvaluation]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
};

// [GET] /api/v1/evaluations/result/:id
// ดึงผลประเมินพร้อมรายละเอียดพนักงานที่เกี่ยวข้อง
exports.getEvaluationResultById = async (req, res) => {
    try {
        const { id } = req.params; // evaluatework_id
        const evaluation = await Evaluation.getById(id, req.companyId);

        if (!evaluation) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการประเมิน' });
        }

        // ดึงข้อมูลพนักงานที่ถูกประเมิน
        const [employee] = await employeeModel.getById(evaluation.emp_id, req.companyId);
        if (!employee) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่เกี่ยวข้อง' });
        }

        // รวมผลประเมินและข้อมูลพนักงานส่งกลับไป
        res.status(200).json({ evaluation, employee });

    } catch (err) {
        console.error("API Error [getEvaluationResultById]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแสดงผล' });
    }
};
