const About = require('../models/aboutModel');

/**
 * แสดงหน้า "เกี่ยวกับ" ซึ่งเป็นฟอร์มสำหรับตั้งค่าระบบ
 */
exports.getAboutPage = async (req, res) => {
  try {
    const editMode = req.query.edit === 'true';
    let about = await About.getAbout();

    // หากไม่มีข้อมูลในฐานข้อมูล ให้สร้าง object เริ่มต้นขึ้นมา
    if (!about) {
      about = {
        startwork: '',
        endwork: '',
        about_late: 0,
        about_sickleave: 0,
        about_personalleave: 0,
        about_annualleave: 0,
        about_maternityleave: 0,
        about_childcareleave: 0,
        about_paternityleave: 0,
        about_militaryleave: 0,
        about_ordinationleave: 0,
        about_sterilizationleave: 0,
        about_trainingleave: 0,
        about_funeralleave: 0,
        work_days: '', // ค่าเริ่มต้นเป็นสตริงว่าง
      };
    }

    res.render('aboutForm', { about, edit: editMode });
  } catch (err) {
    console.error("Error fetching about data:", err);
    res.status(500).send('เกิดข้อผิดพลาดในการโหลดข้อมูล');
  }
};

/**
 * อัปเดตข้อมูลการตั้งค่าระบบ
 */
exports.updateAbout = async (req, res) => {
  try {
    const body = req.body;

    // แปลง work_days จาก array หรือ string เป็น string ที่คั่นด้วย comma
    let workDays = body.work_days || [];
    if (!Array.isArray(workDays)) {
      workDays = [workDays];
    }

    const updateData = {
      startwork: body.startwork,
      endwork: body.endwork,
      about_late: parseInt(body.about_late, 10) || 0,
      about_sickleave: parseInt(body.about_sickleave, 10) || 0,
      about_personalleave: parseInt(body.about_personalleave, 10) || 0,
      about_annualleave: parseInt(body.about_annualleave, 10) || 0,
      about_maternityleave: parseInt(body.about_maternityleave, 10) || 0,
      about_childcareleave: parseInt(body.about_childcareleave, 10) || 0,
      about_paternityleave: parseInt(body.about_paternityleave, 10) || 0,
      about_militaryleave: parseInt(body.about_militaryleave, 10) || 0,
      about_ordinationleave: parseInt(body.about_ordinationleave, 10) || 0,
      about_sterilizationleave: parseInt(body.about_sterilizationleave, 10) || 0,
      about_trainingleave: parseInt(body.about_trainingleave, 10) || 0,
      about_funeralleave: parseInt(body.about_funeralleave, 10) || 0,
      work_days: workDays.join(','),
    };

    await About.updateAbout(updateData);
    res.redirect('/about');
  } catch (err) {
    console.error("Error updating about data:", err);
    res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
  }
};