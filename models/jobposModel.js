const db = require('../config/db');

const Jobpos = {
  getAll: (callback) => {
    db.query('SELECT * FROM jobpos', callback);
  }
};

module.exports = Jobpos;
