// backend/controllers/evaluationController.js
const Evaluation = require('../models/evaluationModel');
const employeeModel = require('../models/employeeModel');

// [GET] /api/v1/evaluations -> ดึงประวัติการประเมินทั้งหมด
exports.getAllEvaluations = async (req, res) => {
    try {
        // ส่ง req.companyId ไปยัง Model
        const evaluations = await Evaluation.getAllEvaluations(req.companyId); // <-- เพิ่ม req.companyId
        res.status(200).json(evaluations);
    } catch (err) {
        console.error("API Error [getAllEvaluations]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการประเมิน' });
    }
};

// [GET] /api/v1/evaluations/:id -> ดึงการประเมินชิ้นเดียวด้วย ID ของการประเมิน
exports.getEvaluationById = async (req, res) => {
    try {
        const { id } = req.params;
        // ส่ง req.companyId ไปยัง Model
        const evaluation = await Evaluation.getById(id, req.companyId); // <-- เพิ่ม req.companyId
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

        // ส่ง req.companyId ไปยัง Model
        const newEvaluation = await Evaluation.saveEvaluation(evaluationData, req.companyId); // <-- เพิ่ม req.companyId
        res.status(201).json(newEvaluation);
    } catch (err) {
        console.error("API Error [createEvaluation]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
};

// [GET] /api/v1/evaluations/result/:id -> ดึงผลประเมินพร้อมข้อมูลพนักงาน
exports.getEvaluationResultById = async (req, res) => {
    try {
        const { id } = req.params; // id นี้คือ evaluatework_id
        // ส่ง req.companyId ไปยัง Model
        const evaluation = await Evaluation.getById(id, req.companyId); // <-- เพิ่ม req.companyId

        if (!evaluation) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลการประเมิน' });
        }

        // ดึงข้อมูลพนักงานที่ถูกประเมิน (ต้องกรองด้วย companyId ด้วย)
        const [employee] = await employeeModel.getById(evaluation.emp_id, req.companyId); // <-- เพิ่ม req.companyId
        if (!employee) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลพนักงานที่เกี่ยวข้อง' });
        }

        res.status(200).json({ evaluation, employee });

    } catch (err) {
        console.error("API Error [getEvaluationResultById]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแสดงผล' });
    }
};