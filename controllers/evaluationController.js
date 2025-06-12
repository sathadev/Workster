const employeeModel = require('../models/employeeModel');
const Evaluation = require('../models/evaluationModel');

/**
 * แสดงหน้าหลักของการประเมิน (รายชื่อพนักงาน)
 */
exports.showEvaluationPage = async (req, res) => {
  try {
    // employeeModel.getAll() ถูกแก้ไขให้รองรับ sort/order ในบทสนทนาก่อนหน้า
    // หากต้องการใช้เวอร์ชันนั้น ให้ส่ง parameter ที่เหมาะสม
    const employees = await employeeModel.getAllSorted('emp_name', 'asc');
    res.render('evaluation/index', { employees, currentUserId: req.session.emp_id });
  } catch (err) {
    console.error("Error fetching employees for evaluation:", err);
    res.status(500).send("Database error");
  }
};

/**
 * แสดงฟอร์มการประเมินสำหรับพนักงานที่เลือก
 */
exports.showEvaluationForm = async (req, res) => {
  const employeeId = req.query.id;
  if (!employeeId) {
    return res.status(400).send('Missing employee ID');
  }

  try {
    const employees = await employeeModel.getById(employeeId);
    if (!employees || employees.length === 0) {
      return res.status(404).send('ไม่พบพนักงาน');
    }
    res.render('evaluation/form', { employee: employees[0] });
  } catch (err) {
    console.error("Error fetching employee for form:", err);
    res.status(500).send("Database error");
  }
};

/**
 * บันทึกผลการประเมิน
 */
exports.saveEvaluation = async (req, res) => {
  const { id: employeeId, q1, q2, q3, q4, q5 } = req.body;

  if (!employeeId) {
    return res.status(400).send('ไม่พบรหัสพนักงานในแบบฟอร์ม');
  }

  try {
    const evaluationData = {
      id: employeeId,
      q1: parseInt(q1, 10),
      q2: parseInt(q2, 10),
      q3: parseInt(q3, 10),
      q4: parseInt(q4, 10),
      q5: parseInt(q5, 10)
    };

    await Evaluation.saveEvaluation(evaluationData);
    res.redirect('/evaluation');
  } catch (err) {
    console.error("Error saving evaluation:", err);
    res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
};

/**
 * แสดงประวัติการประเมินทั้งหมด
 */
exports.getEvaluationHistory = async (req, res) => {
  try {
    const evaluations = await Evaluation.getAllEvaluations();
    res.render('evaluation/history', { evaluations });
  } catch (err) {
    console.error("Error fetching evaluation history:", err);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
};

/**
 * แสดงผลการประเมินรายบุคคล
 */
exports.showEvaluationById = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluation = await Evaluation.getById(id);

    if (!evaluation) {
      return res.status(404).send('ไม่พบข้อมูลการประเมิน');
    }

    const employeeResults = await employeeModel.getById(evaluation.emp_id);
    if (!employeeResults || employeeResults.length === 0) {
      return res.status(404).send('ไม่พบข้อมูลพนักงานที่เกี่ยวข้อง');
    }

    res.render('evaluation/result', {
      evaluation,
      employee: employeeResults[0]
    });

  } catch (err) {
    console.error("Error showing evaluation result:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการแสดงผล");
  }
};