const Jobpos = require('../models/jobposModel');
const Employee = require('../models/employeeModel');

// แสดงรายการตำแหน่งงานทั้งหมด
exports.list = async (req, res) => {
  try {
    const positions = await Jobpos.getAll();
    res.render('position/index', { positions });
  } catch (err) {
    console.error("Error fetching positions:", err);
    // ส่งหน้า Error หรือข้อความแสดงข้อผิดพลาดที่เหมาะสม
    res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่งงาน");
  }
};

// แสดงรายละเอียดตำแหน่งงานและพนักงานในตำแหน่งนั้น
exports.view = async (req, res) => {
  try {
    const jobposId = req.params.id;

    // ดึงข้อมูลตำแหน่งงานและข้อมูลพนักงานไปพร้อมกันเพื่อประสิทธิภาพ
    const [jobposResults, employeeResults] = await Promise.all([
      Jobpos.getById(jobposId),
      Employee.getByJobposId(jobposId)
    ]);

    if (jobposResults.length === 0) {
      return res.status(404).send('ไม่พบตำแหน่งนี้');
    }

    res.render('position/view', {
      jobpos: jobposResults[0],
      employees: employeeResults
    });

  } catch (err) {
    console.error("Error fetching position details:", err);
    res.status(500).send("เกิดข้อผิดพลาดในการดึงข้อมูลรายละเอียดตำแหน่งงาน");
  }
};

// เพิ่มตำแหน่งงานใหม่
exports.add = async (req, res) => {
  const { jobpos_name } = req.body;

  // ตรวจสอบว่าชื่อตำแหน่งไม่เป็นค่าว่าง
  if (!jobpos_name || !jobpos_name.trim()) {
    // ในระบบจริง อาจจะใช้ flash message เพื่อแจ้งเตือนผู้ใช้
    return res.redirect('/position');
  }

  try {
    await Jobpos.create(jobpos_name.trim());
    res.redirect('/position');
  } catch (err) {
    console.error("Error creating position:", err);
    // จัดการกับ Error ที่อาจเกิดขึ้น เช่น ชื่อตำแหน่งซ้ำ
    // และแจ้งเตือนผู้ใช้ผ่าน flash message
    res.status(500).redirect('/position'); // หรือ render หน้าเดิมพร้อม error message
  }
};