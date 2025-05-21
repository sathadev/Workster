const db = require('../config/db');

const Jobpos = {
  getAll: (callback) => {
    db.query('SELECT * FROM jobpos', callback);
  },

  getById: (id, callback) => {
    db.query('SELECT * FROM jobpos WHERE jobpos_id = ?', [id], callback);
  },

  create: (jobpos_name, callback) => {
    const query = 'INSERT INTO jobpos (jobpos_name) VALUES (?)';
    db.query(query, [jobpos_name], callback);
  }
};

module.exports = Jobpos;
