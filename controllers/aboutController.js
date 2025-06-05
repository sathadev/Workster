const About = require('../models/aboutModel');

exports.getAboutPage = (req, res) => {
  const editMode = req.query.edit === 'true';

  About.getAbout((err, about) => {
    if (err) {
      console.error(err);
      return res.status(500).send('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }

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
        work_days: '',
      };
    }

    res.render('aboutForm', { about, edit: editMode });
  });
};


exports.updateAbout = (req, res) => {
  let body = req.body;

  // แปลง work_days จาก array หรือ string เป็น string ที่คั่นด้วย comma
  let workDays = body.work_days || [];
  if (!Array.isArray(workDays)) {
    workDays = [workDays];
  }

  const updateData = {
    startwork: body.startwork,
    endwork: body.endwork,
    about_late: parseInt(body.about_late) || 0,
    about_sickleave: parseInt(body.about_sickleave) || 0,
    about_personalleave: parseInt(body.about_personalleave) || 0,
    about_annualleave: parseInt(body.about_annualleave) || 0,
    about_maternityleave: parseInt(body.about_maternityleave) || 0,
    about_childcareleave: parseInt(body.about_childcareleave) || 0,
    about_paternityleave: parseInt(body.about_paternityleave) || 0,
    about_militaryleave: parseInt(body.about_militaryleave) || 0,
    about_ordinationleave: parseInt(body.about_ordinationleave) || 0,
    about_sterilizationleave: parseInt(body.about_sterilizationleave) || 0,
    about_trainingleave: parseInt(body.about_trainingleave) || 0,
    about_funeralleave: parseInt(body.about_funeralleave) || 0,
    work_days: workDays.join(','),
  };

  About.updateAbout(updateData, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
    res.redirect('/about');
  });
};
