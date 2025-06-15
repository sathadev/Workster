const express = require('express');
const router = express.Router();
const jobposController = require('../controllers/jobposController');

// Routes
router.get('/position', jobposController.list);
router.get('/position/view/:id', jobposController.view);
router.post('/position/add', jobposController.add);

module.exports = router;
