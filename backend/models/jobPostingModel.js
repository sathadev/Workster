// backend/models/jobPostingModel.js
// โมเดลสำหรับจัดการข้อมูล "ประกาศรับสมัครงาน (Job Postings)"
// ใช้เชื่อมต่อกับฐานข้อมูลผ่าน query utility

const query = require('../utils/db'); // ฟังก์ชัน query หลักที่ใช้สั่ง SQL

// SQL หลักสำหรับดึงข้อมูลประกาศรับสมัครงาน
// รวมข้อมูลจากตาราง companies และ jobpos ด้วย (เพื่อให้ได้ company_name และ jobpos_name)
// ไม่รวม WHERE, ORDER BY, LIMIT — จะถูกเติมในแต่ละฟังก์ชัน
const JOB_POSTING_QUERY_FIELDS_COMPREHENSIVE = `
    SELECT
        jp.job_posting_id,
        jp.company_id,
        c.company_name,
        c.company_status,
        jp.job_title,
        jp.jobpos_id,
        jb.jobpos_name,
        jp.job_location_text,
        jp.salary_min,
        jp.salary_max,
        jp.job_description,
        jp.qualifications_text,
        jp.benefits_text,
        jp.contact_person_name,
        jp.contact_phone,
        jp.contact_email,
        jp.contact_address_text,
        jp.job_status,
        jp.posted_at,
        jp.application_deadline,
        jp.updated_at
    FROM job_postings jp
    JOIN companies c ON jp.company_id = c.company_id
    LEFT JOIN jobpos jb ON jp.jobpos_id = jb.jobpos_id
`;

const JobPostingModel = {
    // ดึงรายการประกาศทั้งหมด (รองรับ filter, search, sort, pagination)
    // ใช้ได้ทั้งฝั่ง HR/Admin (มี companyId) หรือ Public (companyId = null)
    getAllJobPostings: async (options = {}, companyId) => {
        const {
            search = '',
            status = '',
            jobpos_id = '',
            page = 1,
            limit = 10,
            sort = 'posted_at',
            order = 'desc'
        } = options;

        let params = [];
        let whereClauses = [];

        // เฉพาะบริษัทของตัวเอง (ยกเว้นกรณี Public/SuperAdmin)
        if (companyId !== null) {
            whereClauses.push(`jp.company_id = ?`);
            params.push(companyId);
        }

        // ค้นหาด้วยคำค้น เช่น ชื่อตำแหน่งหรือบริษัท
        if (search) {
            whereClauses.push(`(jp.job_title LIKE ? OR c.company_name LIKE ? OR jp.job_description LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // กรองตามสถานะ เช่น active / closed
        if (status) {
            whereClauses.push(`jp.job_status = ?`);
            params.push(status);
        }

        // กรองตามตำแหน่ง
        if (jobpos_id) {
            whereClauses.push(`jp.jobpos_id = ?`);
            params.push(parseInt(jobpos_id));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // ดึงจำนวนทั้งหมด (ใช้สำหรับ pagination)
        const countSql = `
            SELECT COUNT(jp.job_posting_id) as total
            FROM job_postings jp
            JOIN companies c ON jp.company_id = c.company_id
            LEFT JOIN jobpos jb ON jp.jobpos_id = jb.jobpos_id
            ${whereSql}
        `;
        const [totalResult] = await query(countSql, params);
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit) || 1;
        const offset = (page - 1) * limit;

        // กำหนด column ที่สามารถ sort ได้
        const sortableColumns = {
            job_title: 'jp.job_title',
            company_name: 'c.company_name',
            posted_at: 'jp.posted_at',
            application_deadline: 'jp.application_deadline',
            job_status: 'jp.job_status',
            salary_min: 'jp.salary_min',
            salary_max: 'jp.salary_max'
        };
        const sortColumn = sortableColumns[sort] || 'jp.posted_at';
        const sortDirection = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // ดึงข้อมูลจริงตามหน้า (page) ที่เลือก
        const dataSql = `
            ${JOB_POSTING_QUERY_FIELDS_COMPREHENSIVE}
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const jobPostings = await query(dataSql, finalParams);

        // ส่งข้อมูลพร้อม meta สำหรับหน้า UI
        return {
            data: jobPostings,
            meta: {
                totalItems,
                totalPages,
                currentPage: parseInt(page),
                itemsPerPage: parseInt(limit)
            },
        };
    },

    // ดึงประกาศรับสมัครงานด้วย ID เดียว
    // ใช้ได้ทั้งฝั่ง HR/Admin และ Public (กรณี companyId = null)
    getJobPostingById: async (id, companyId) => {
        let sql = `
            ${JOB_POSTING_QUERY_FIELDS_COMPREHENSIVE}
            WHERE jp.job_posting_id = ?
        `;
        const params = [id];

        // ถ้าไม่ใช่ public ให้เช็ก company_id ด้วย
        if (companyId !== null) {
            sql += ` AND jp.company_id = ?`;
            params.push(companyId);
        }

        const results = await query(sql, params);
        return results[0] || null;
    },

    // เพิ่มประกาศรับสมัครงานใหม่
    // คืนค่าประกาศที่เพิ่งสร้าง (พร้อม company_name และ jobpos_name)
    createJobPosting: async (data, companyId) => {
        const {
            job_title, jobpos_id, job_location_text,
            salary_min, salary_max, job_description, qualifications_text,
            benefits_text, contact_person_name, contact_phone, contact_email,
            contact_address_text, job_status, application_deadline
        } = data;

        const sql = `
            INSERT INTO job_postings (
                company_id, job_title, jobpos_id, job_location_text,
                salary_min, salary_max, job_description, qualifications_text,
                benefits_text, contact_person_name, contact_phone, contact_email,
                contact_address_text, job_status, application_deadline
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            companyId, job_title, jobpos_id || null, job_location_text,
            salary_min || null, salary_max || null, job_description, qualifications_text,
            benefits_text, contact_person_name, contact_phone, contact_email,
            contact_address_text, job_status || 'active', application_deadline || null
        ];

        const result = await query(sql, values);
        return await JobPostingModel.getJobPostingById(result.insertId, companyId);
    },

    // อัปเดตข้อมูลประกาศรับสมัครงาน
    // ตรวจสอบสิทธิ์ก่อน (ต้องเป็นประกาศของบริษัทเดียวกัน)
    updateJobPosting: async (id, data, companyId) => {
        const {
            job_title, jobpos_id, job_location_text,
            salary_min, salary_max, job_description, qualifications_text,
            benefits_text, contact_person_name, contact_phone, contact_email,
            contact_address_text, job_status, application_deadline
        } = data;

        // ตรวจสอบสิทธิ์ก่อนอัปเดต
        const existingPosting = await JobPostingModel.getJobPostingById(id, companyId);
        if (!existingPosting) return null;

        const sql = `
            UPDATE job_postings SET
                job_title = ?, jobpos_id = ?, job_location_text = ?,
                salary_min = ?, salary_max = ?, job_description = ?, qualifications_text = ?,
                benefits_text = ?, contact_person_name = ?, contact_phone = ?, contact_email = ?,
                contact_address_text = ?, job_status = ?, application_deadline = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE job_posting_id = ? AND company_id = ?
        `;
        const values = [
            job_title, jobpos_id || null, job_location_text,
            salary_min || null, salary_max || null, job_description, qualifications_text,
            benefits_text, contact_person_name, contact_phone, contact_email,
            contact_address_text, job_status || 'active', application_deadline || null,
            id, companyId
        ];

        const result = await query(sql, values);
        if (result.affectedRows === 0) return null;

        return await JobPostingModel.getJobPostingById(id, companyId);
    },

    // ลบประกาศรับสมัครงาน
    // ตรวจสอบสิทธิ์ก่อนว่าประกาศเป็นของบริษัทนั้นจริง
    deleteJobPosting: async (id, companyId) => {
        const existingPosting = await JobPostingModel.getJobPostingById(id, companyId);
        if (!existingPosting) return false;

        const sql = `DELETE FROM job_postings WHERE job_posting_id = ? AND company_id = ?`;
        const result = await query(sql, [id, companyId]);
        return result.affectedRows > 0;
    },
};

module.exports = JobPostingModel;
