const employeeModel = require('../models/employeeModel');
const Evaluation = require('../models/evaluationModel');

const db = require('../config/db');

exports.showEvaluationPage = (req, res) => {
  employeeModel.getAll((err, employees) => {
    if (err) {
      return res.status(500).send("Database error");
    }
    res.render('evaluation/index', { employees });
  });
};

exports.showEvaluationForm = (req, res) => {
  const employeeId = req.query.id;
  if (!employeeId) return res.status(400).send('Missing employee ID');

  employeeModel.getById(employeeId, (err, employees) => {
    if (err || !employees || employees.length === 0) return res.status(404).send('ไม่พบพนักงาน');

    const employee = employees[0];
    res.render('evaluation/form', { employee });
  });
};

exports.saveEvaluation = (req, res) => {
  const employeeId = req.body.id;

  if (!employeeId) {
    return res.status(400).send('ไม่พบรหัสพนักงานในแบบฟอร์ม');
  }

  const q1 = parseInt(req.body.q1, 10);
  const q2 = parseInt(req.body.q2, 10);
  const q3 = parseInt(req.body.q3, 10);
  const q4 = parseInt(req.body.q4, 10);
  const q5 = parseInt(req.body.q5, 10);

  Evaluation.saveEvaluation({
    id: employeeId,
    q1, q2, q3, q4, q5
  }, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    res.redirect('/evaluation');
  });
};

exports.getEvaluationHistory = (req, res) => {
  Evaluation.getAllEvaluations((err, evaluations) => {
    if (err) {
      console.error(err);
      return res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
    }
    res.render('evaluation/history', { evaluations });
  });
};

exports.showEvaluationById = (req, res) => {
  const id = req.params.id;

  Evaluation.getById(id, (err, evaluation) => {
    if (err || !evaluation) {
      return res.status(404).send('ไม่พบข้อมูลการประเมิน');
    }

    employeeModel.getById(evaluation.emp_id, (err2, employee) => {
      if (err2 || !employee) {
        return res.status(404).send('ไม่พบข้อมูลพนักงาน');
      }

      res.render('evaluation/result', { evaluation, employee });
    });
  });
};
