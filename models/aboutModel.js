const db = require('../db');

const About = {
  getAbout: (callback) => {
    db.query('SELECT * FROM about LIMIT 1', (err, results) => {
      if (err) return callback(err);
      callback(null, results[0] || null);
    });
  },

  updateAbout: (data, callback) => {
    const sql = `
      UPDATE about SET 
        startwork = ?,
        endwork = ?,
        about_late = ?,
        about_sickleave = ?,
        about_personalleave = ?,
        about_annualleave = ?,
        about_maternityleave = ?,
        about_childcareleave = ?,
        about_paternityleave = ?,
        about_militaryleave = ?,
        about_ordinationleave = ?,
        about_sterilizationleave = ?,
        about_trainingleave = ?,
        about_funeralleave = ?,
        work_days = ?
      LIMIT 1
    `;
    const params = [
      data.startwork,
      data.endwork,
      data.about_late,
      data.about_sickleave,
      data.about_personalleave,
      data.about_annualleave,
      data.about_maternityleave,
      data.about_childcareleave,
      data.about_paternityleave,
      data.about_militaryleave,
      data.about_ordinationleave,
      data.about_sterilizationleave,
      data.about_trainingleave,
      data.about_funeralleave,
      data.work_days,
    ];
    db.query(sql, params, (err, result) => {
      if (err) return callback(err);
      callback(null, result);
    });
  },
};

module.exports = About;
