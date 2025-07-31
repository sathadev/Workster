// backend/controllers/jobPostingController.js
const JobPostingModel = require('../models/jobPostingModel');
const EmployeeModel = require('../models/employeeModel'); // เพื่อดึง jobpos_name ของผู้ประกาศ

/**
 * @desc ดึงข้อมูลประกาศรับสมัครงานทั้งหมด (สำหรับ HR/Admin)
 * @route GET /api/v1/job-postings
 * @access HR/Admin (jobpos_id 1,2,3)
 */
exports.getAllJobPostings = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: เฉพาะ Admin/HR เท่านั้น
        if (!req.user || ![1, 2, 3].includes(req.user.jobpos_id)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
        }

        const result = await JobPostingModel.getAllJobPostings(req.query, req.companyId);
        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getAllJobPostings]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงาน" });
    }
};

/**
 * @desc ดึงข้อมูลประกาศรับสมัครงานเดียวด้วย ID
 * @route GET /api/v1/job-postings/:id
 * @access HR/Admin (jobpos_id 1,2,3)
 */
exports.getJobPostingById = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: เฉพาะ Admin/HR เท่านั้น
        if (!req.user || ![1, 2, 3].includes(req.user.jobpos_id)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้' });
        }

        const { id } = req.params;
        const jobPosting = await JobPostingModel.getJobPostingById(id, req.companyId);

        if (!jobPosting) {
            return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานนี้' });
        }
        res.status(200).json(jobPosting);
    } catch (err) {
        console.error('API Error [getJobPostingById]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงาน' });
    }
};

/**
 * @desc สร้างประกาศรับสมัครงานใหม่
 * @route POST /api/v1/job-postings
 * @access HR/Admin (jobpos_id 1,2,3)
 */
exports.createJobPosting = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: เฉพาะ Admin/HR เท่านั้น
        if (!req.user || ![1, 2, 3].includes(req.user.jobpos_id)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์สร้างประกาศรับสมัครงาน' });
        }

        const newJobPosting = await JobPostingModel.createJobPosting(req.body, req.companyId);
        res.status(201).json(newJobPosting);
    } catch (err) {
        console.error("API Error [createJobPosting]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการสร้างประกาศรับสมัครงาน" });
    }
};

/**
 * @desc อัปเดตประกาศรับสมัครงาน
 * @route PUT /api/v1/job-postings/:id
 * @access HR/Admin (jobpos_id 1,2,3)
 */
exports.updateJobPosting = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: เฉพาะ Admin/HR เท่านั้น
        if (!req.user || ![1, 2, 3].includes(req.user.jobpos_id)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์แก้ไขประกาศรับสมัครงาน' });
        }

        const { id } = req.params;
        const updatedJobPosting = await JobPostingModel.updateJobPosting(id, req.body, req.companyId);

        if (!updatedJobPosting) {
            return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานที่จะอัปเดต หรือคุณไม่มีสิทธิ์' });
        }
        res.status(200).json(updatedJobPosting);
    } catch (err) {
        console.error("API Error [updateJobPosting]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตประกาศรับสมัครงาน" });
    }
};

/**
 * @desc ลบประกาศรับสมัครงาน
 * @route DELETE /api/v1/job-postings/:id
 * @access HR/Admin (jobpos_id 1,2,3)
 */
exports.deleteJobPosting = async (req, res) => {
    try {
        // ตรวจสอบสิทธิ์: เฉพาะ Admin/HR เท่านั้น
        if (!req.user || ![1, 2, 3].includes(req.user.jobpos_id)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบประกาศรับสมัครงาน' });
        }

        const { id } = req.params;
        const deleted = await JobPostingModel.deleteJobPosting(id, req.companyId);

        if (!deleted) {
            return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานที่ต้องการลบ หรือคุณไม่มีสิทธิ์' });
        }
        res.status(204).send(); // 204 No Content สำหรับการลบสำเร็จ
    } catch (err) {
        console.error("API Error [deleteJobPosting]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบประกาศรับสมัครงาน" });
    }
};

// --- Public Endpoints (สำหรับผู้สมัครงานทั่วไป) ---

/**
 * @desc ดึงข้อมูลประกาศรับสมัครงานทั้งหมดที่ Active (สำหรับ Public)
 * @route GET /api/v1/public/job-postings
 * @access Public
 */
exports.getPublicJobPostings = async (req, res) => {
    try {
        // ดึงเฉพาะประกาศที่ status เป็น 'active' และ company_status เป็น 'approved'
        const options = { ...req.query, status: 'active' };
        const result = await JobPostingModel.getAllJobPostings(options, null); // companyId เป็น null เพื่อดึงทั้งหมด
        
        // กรองเฉพาะบริษัทที่ approved
        result.data = result.data.filter(post => post.company_status === 'approved');

        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getPublicJobPostings]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงานสาธารณะ" });
    }
};

/**
 * @desc ดึงข้อมูลประกาศรับสมัครงานเดียวด้วย ID (สำหรับ Public)
 * @route GET /api/v1/public/job-postings/:id
 * @access Public
 */
exports.getPublicJobPostingById = async (req, res) => {
    try {
        const { id } = req.params;
        const jobPosting = await JobPostingModel.getJobPostingById(id, null); // companyId เป็น null เพื่อดึงไม่ว่าบริษัทไหน

        if (!jobPosting || jobPosting.job_status !== 'active' || jobPosting.company_status !== 'approved') {
            return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานนี้ หรือประกาศไม่พร้อมใช้งาน' });
        }
        res.status(200).json(jobPosting);
    } catch (err) {
        console.error('API Error [getPublicJobPostingById]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงานสาธารณะ' });
    }
};
