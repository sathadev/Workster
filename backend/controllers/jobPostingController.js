// backend/controllers/jobPostingController.js
// Controller สำหรับจัดการ “ประกาศรับสมัครงาน (Job Postings)”
// แยกตามสิทธิ์การใช้งาน: HR/Admin (ภายในบริษัท) และ Public (ภายนอกบริษัท)

const JobPostingModel = require('../models/jobPostingModel');
const EmployeeModel = require('../models/employeeModel'); // เพื่อดึง jobpos_name ของผู้ประกาศ

// [GET] /api/v1/job-postings
// ดึงข้อมูลประกาศรับสมัครงานทั้งหมด (เฉพาะ HR/Admin)
// จำกัดสิทธิ์เฉพาะตำแหน่งงานที่ jobpos_id เป็น 1, 2, 3
exports.getAllJobPostings = async (req, res) => {
    try {
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

// [GET] /api/v1/job-postings/:id
// ดึงข้อมูลประกาศรับสมัครงานรายตัว (เฉพาะ HR/Admin)
exports.getJobPostingById = async (req, res) => {
    try {
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

// [POST] /api/v1/job-postings
// สร้างประกาศรับสมัครงานใหม่ (เฉพาะ HR/Admin)
exports.createJobPosting = async (req, res) => {
    try {
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

// [PUT] /api/v1/job-postings/:id
// แก้ไขข้อมูลประกาศรับสมัครงาน (เฉพาะ HR/Admin)
exports.updateJobPosting = async (req, res) => {
    try {
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

// [DELETE] /api/v1/job-postings/:id
// ลบประกาศรับสมัครงาน (เฉพาะ HR/Admin)
exports.deleteJobPosting = async (req, res) => {
    try {
        if (!req.user || ![1, 2, 3].includes(req.user.jobpos_id)) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ลบประกาศรับสมัครงาน' });
        }

        const { id } = req.params;
        const deleted = await JobPostingModel.deleteJobPosting(id, req.companyId);

        if (!deleted) {
            return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานที่ต้องการลบ หรือคุณไม่มีสิทธิ์' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("API Error [deleteJobPosting]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบประกาศรับสมัครงาน" });
    }
};

// [GET] /api/v1/public/job-postings
// ดึงข้อมูลประกาศรับสมัครงานทั้งหมดที่เปิดรับสมัคร (Public)
// แสดงเฉพาะที่ job_status = 'active' และ company_status = 'approved'
exports.getPublicJobPostings = async (req, res) => {
    try {
        const options = { ...req.query, status: 'active' };
        const result = await JobPostingModel.getAllJobPostings(options, null);
        result.data = result.data.filter(post => post.company_status === 'approved');
        res.status(200).json(result);
    } catch (err) {
        console.error("API Error [getPublicJobPostings]:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงานสาธารณะ" });
    }
};

// [GET] /api/v1/public/job-postings/:id 
// ดึงประกาศรับสมัครงานเฉพาะรายการ (Public) 
// ใช้สำหรับหน้ารายละเอียดประกาศที่ผู้สมัครดูได้ 
exports.getPublicJobPostingById = async (req, res) => {
    try {
        const { id } = req.params;
        const jobPosting = await JobPostingModel.getJobPostingById(id, null);

        if (!jobPosting || jobPosting.job_status !== 'active' || jobPosting.company_status !== 'approved') {
            return res.status(404).json({ message: 'ไม่พบประกาศรับสมัครงานนี้ หรือประกาศไม่พร้อมใช้งาน' });
        }
        res.status(200).json(jobPosting);
    } catch (err) {
        console.error('API Error [getPublicJobPostingById]:', err);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงานสาธารณะ' });
    }
};
