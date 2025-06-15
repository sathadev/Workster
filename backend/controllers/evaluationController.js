// backend/controllers/evaluationController.js

const Evaluation = require('../models/evaluationModel');

// [GET] /api/v1/evaluations -> ดึงประวัติการประเมินทั้งหมด
exports.getAllEvaluations = async (req, res) => {
  try {
    const evaluations = await Evaluation.getAllEvaluations();
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
    const evaluation = await Evaluation.getById(id);
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

    const newEvaluation = await Evaluation.saveEvaluation(evaluationData);
    res.status(201).json(newEvaluation); // 201 Created
  } catch (err) {
    console.error("API Error [createEvaluation]:", err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

// [GET] /api/v1/employees/:id/evaluations -> ดึงประวัติการประเมินของพนักงานคนเดียว
exports.getEvaluationsByEmployeeId = async (req, res) => {
    try {
        const { id } = req.params; // id ในที่นี้คือ emp_id
        const evaluations = await Evaluation.getByEmployeeId(id);
        res.status(200).json(evaluations);
    } catch (err) {
        console.error("API Error [getEvaluationsByEmployeeId]:", err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติการประเมินของพนักงาน' });
    }
};