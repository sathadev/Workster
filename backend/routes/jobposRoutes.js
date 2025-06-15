// backend/routes/jobposRoutes.js
const express = require('express');
const router = express.Router();
const jobposController = require('../controllers/jobposController');

// GET /api/v1/positions -> ดึงตำแหน่งงานทั้งหมด
router.get('/', jobposController.getAllPositions);

// POST /api/v1/positions -> สร้างตำแหน่งงานใหม่
router.post('/', jobposController.createPosition);

// GET /api/v1/positions/:id -> ดึงตำแหน่งงานเดียว
router.get('/:id', jobposController.getPositionById);

// PUT /api/v1/positions/:id -> อัปเดตตำแหน่งงาน
router.put('/:id', jobposController.updatePosition);

// DELETE /api/v1/positions/:id -> ลบตำแหน่งงาน
router.delete('/:id', jobposController.deletePosition);

module.exports = router;