// backend/controllers/evaluationController.js
const Evaluation = require('../models/evaluationModel'); // <--- ตรวจสอบว่า Path ถูกต้อง
const employeeModel = require('../models/employeeModel'); // <--- ตรวจสอบว่า Path ถูกต้อง

// [GET] /api/v1/evaluations -> ดึงประวัติการประเมินทั้งหมด
exports.getAllEvaluations = async (req, res) => {
    try {
        // <--- เพิ่ม console.log เพื่อ Debug ใน Controller
        console.log('Controller: getAllEvaluations called with query:', req.query, 'and companyId:', req.companyId);
        // --->
        // ต้องส่ง 2 พารามิเตอร์: options (req.query) และ companyId (req.companyId)
        const evaluations = await Evaluation.getAllEvaluations(req.query, req.companyId);
        res.status(200).json(evaluations); // <--- Controller เป็นผู้ส่ง Response
    } catch (err) {
        console.error("API Error [getAllEvaluations]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการประเมิน' });
    }
};

// [GET] /api/v1/evaluations/years -> ดึงปีที่มีข้อมูลการประเมิน
exports.getEvaluationYears = async (req, res) => {
    try {
        // <--- เพิ่ม console.log เพื่อ Debug ใน Controller
        console.log('Controller: getEvaluationYears called with companyId:', req.companyId);
        // --->
        // ส่ง req.companyId ไปยัง Model
        const years = await Evaluation.getAllEvaluationYears(req.companyId);
        res.status(200).json(years); // <--- Controller เป็นผู้ส่ง Response
    } catch (err) {
        console.error("API Error [getEvaluationYears]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลปีการประเมิน' });
    }
};

// [GET] /api/v1/evaluations/:id -> ดึงการประเมินชิ้นเดียวด้วย ID ของการประเมิน
exports.getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        const evaluation = await Evaluation.getById(id, req.companyId); // ส่ง companyId
        if (!evaluation) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการประเมิน' });
        }
        res.status(200).json(evaluation);
    } catch (err) {
        console.error("API Error [getEvaluationById]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแสดงผล' });
    }
};

// [POST] /api/v1/evaluations -> บันทึกผลการประเมินใหม่
exports.createEvaluation = async (req, res) => {
    try {
        // req.body ควรจะมีหน้าตาประมาณ { emp_id: 4, q1: 5, q2: 4, ... }
        const evaluationData = {
            emp_id: parseInt(req.body.emp_id, 10),
            q1: parseInt(req.body.q1, 10),
            q2: parseInt(req.body.q2, 10),
            q3: parseInt(req.body.q3, 10),
            q4: parseInt(req.body.q4, 10),
            q5: parseInt(req.body.q5, 10)
        };

        if (!evaluationData.emp_id) {
            return res.status(400).json({ message: 'ไม่พบรหัสพนักงาน' });
        }

        const newEvaluation = await Evaluation.saveEvaluation(evaluationData, req.companyId); // ส่ง companyId
        res.status(201).json(newEvaluation); // 201 Created
    } catch (err) {
        console.error("API Error [createEvaluation]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
};

// [GET] /api/v1/evaluations/result/:id -> ดึงผลประเมินพร้อมข้อมูลพนักงาน
exports.getEvaluationResultById = async (req, res) => {
    try {
        const { id } = req.params; // id นี้คือ evaluatework_id
        const evaluation = await Evaluation.getById(id, req.companyId); // ส่ง companyId

        if (!evaluation) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการประเมิน' });
        }

        // ดึงข้อมูลพนักงานที่ถูกประเมิน
        const [employee] = await employeeModel.getById(evaluation.emp_id, req.companyId); // ส่ง companyId
        if (!employee) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่เกี่ยวข้อง' });
        }

        // ส่งข้อมูลทั้งสองส่วนกลับไปพร้อมกัน
        res.status(200).json({ evaluation, employee });

    } catch (err) {
        console.error("API Error [getEvaluationResultById]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแสดงผล' });
    }
};
