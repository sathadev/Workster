    // backend/routes/jobposRoutes.js
    const express = require('express');
    const router = express.Router();
    const jobposController = require('../controllers/jobposController');
    const { protect } = require('../middleware/authMiddleware');

    // --- Public Route (ไม่ต้อง protect) ---
    // GET /api/v1/positions/public
    router.get('/public', jobposController.getPublicPositions);

    // --- Protected Routes (ต้อง protect) ---
    // ทุก Route ควรถูกป้องกัน เพราะเป็นการจัดการข้อมูลหลักของบริษัท

    // GET /api/v1/positions
    router.get('/', protect, jobposController.getAllPositions);

    // GET /api/v1/positions/:id
    router.get('/:id', protect, jobposController.getPositionById);

    // POST /api/v1/positions
    router.post('/', protect, jobposController.createPosition);

    // PUT /api/v1/positions/:id
    router.put('/:id', protect, jobposController.updatePosition);

    // DELETE /api/v1/positions/:id
    router.delete('/:id', protect, jobposController.deletePosition);

    module.exports = router;
    