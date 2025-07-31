// backend/models/jobPostingModel.js
const query = require('../utils/db'); // ใช้ db utility ที่รวมศูนย์

// SQL สำหรับดึงข้อมูลประกาศรับสมัครงานพร้อม JOIN ตารางที่เกี่ยวข้อง
// รวมถึง company_name และ company_status จากตาราง companies
// และ jobpos_name จากตาราง jobpos (ถ้ามี)
// *** สำคัญ: ไม่มี WHERE, ORDER BY, LIMIT/OFFSET หรือ GROUP BY ในส่วนนี้ ***
// ส่วนเหล่านั้นจะถูกเพิ่มเข้ามาในฟังก์ชัน getAllJobPostings หรือ getJobPostingById
const JOB_POSTING_QUERY_FIELDS_COMPREHENSIVE = `
    SELECT
        jp.job_posting_id,
        jp.company_id,
        c.company_name,
        c.company_status, -- <-- เพิ่ม company_status ตรงนี้
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
    /**
     * ดึงข้อมูลประกาศรับสมัครงานทั้งหมด พร้อมรองรับการค้นหา, กรอง, เรียงลำดับ และแบ่งหน้า
     * @param {object} options - อ็อพชันสำหรับ search, status, jobpos_id, page, limit, sort, order
     * @param {number|null} companyId - ID ของบริษัทที่ต้องการกรองข้อมูล (สำหรับ Admin/HR) หรือ null สำหรับ Super Admin/Public
     * @returns {Promise<{data: Array, meta: object}>} - ข้อมูลประกาศพร้อมข้อมูล meta สำหรับการแบ่งหน้า
     */
    getAllJobPostings: async (options = {}, companyId) => {
        const {
            search = '',
            status = '', // 'active', 'closed', 'draft'
            jobpos_id = '', // jobpos_id ที่ประกาศ
            page = 1,
            limit = 10,
            sort = 'posted_at',
            order = 'desc'
        } = options;

        let params = [];
        let whereClauses = [];

        // กรองตาม companyId ถ้าไม่ใช่ null (คือไม่ใช่ Super Admin หรือ Public)
        if (companyId !== null) {
            whereClauses.push(`jp.company_id = ?`);
            params.push(companyId);
        }

        if (search) {
            whereClauses.push(`(jp.job_title LIKE ? OR c.company_name LIKE ? OR jp.job_description LIKE ?)`);
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        if (status) {
            whereClauses.push(`jp.job_status = ?`);
            params.push(status);
        }
        if (jobpos_id) {
            whereClauses.push(`jp.jobpos_id = ?`);
            params.push(parseInt(jobpos_id));
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // 1. นับจำนวนทั้งหมด
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

        // 2. ดึงข้อมูลจริงพร้อม pagination
        const offset = (page - 1) * limit;

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

        const dataSql = `
            ${JOB_POSTING_QUERY_FIELDS_COMPREHENSIVE}
            ${whereSql}
            ORDER BY ${sortColumn} ${sortDirection}
            LIMIT ? OFFSET ?
        `;
        const finalParams = [...params, parseInt(limit), parseInt(offset)];
        const jobPostings = await query(dataSql, finalParams);

        return {
            data: jobPostings,
            meta: { totalItems, totalPages, currentPage: parseInt(page), itemsPerPage: parseInt(limit) },
        };
    },

    /**
     * ดึงข้อมูลประกาศรับสมัครงานด้วย ID
     * @param {number} id - ID ของประกาศ
     * @param {number|null} companyId - ID ของบริษัท (เพื่อตรวจสอบสิทธิ์) หรือ null สำหรับ Public
     * @returns {Promise<object|null>} - อ็อบเจกต์ประกาศ หรือ null ถ้าไม่พบ
     */
    getJobPostingById: async (id, companyId) => {
        let sql = `
            ${JOB_POSTING_QUERY_FIELDS_COMPREHENSIVE}
            WHERE jp.job_posting_id = ?
        `;
        const params = [id];

        if (companyId !== null) { // ถ้าไม่ใช่ Super Admin หรือ Public ให้กรองด้วย company_id ด้วย
            sql += ` AND jp.company_id = ?`;
            params.push(companyId);
        }

        const results = await query(sql, params);
        return results[0] || null;
    },

    /**
     * สร้างประกาศรับสมัครงานใหม่
     * @param {object} data - ข้อมูลประกาศ
     * @param {number} companyId - ID ของบริษัทที่ประกาศ
     * @returns {Promise<object>} - อ็อบเจกต์ประกาศที่สร้างใหม่
     */
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            companyId, job_title, jobpos_id || null, job_location_text,
            salary_min || null, salary_max || null, job_description, qualifications_text,
            benefits_text, contact_person_name, contact_phone, contact_email,
            contact_address_text, job_status || 'active', application_deadline || null
        ];
        const result = await query(sql, values);
        // ดึงข้อมูลที่สร้างใหม่กลับมาพร้อม company_name และ company_status
        return await JobPostingModel.getJobPostingById(result.insertId, companyId);
    },

    /**
     * อัปเดตประกาศรับสมัครงาน
     * @param {number} id - ID ของประกาศ
     * @param {object} data - ข้อมูลที่จะอัปเดต
     * @param {number} companyId - ID ของบริษัท (เพื่อตรวจสอบสิทธิ์)
     * @returns {Promise<object|null>} - อ็อบเจกต์ประกาศที่อัปเดตแล้ว หรือ null ถ้าไม่พบ/ไม่มีสิทธิ์
     */
    updateJobPosting: async (id, data, companyId) => {
        const {
            job_title, jobpos_id, job_location_text,
            salary_min, salary_max, job_description, qualifications_text,
            benefits_text, contact_person_name, contact_phone, contact_email,
            contact_address_text, job_status, application_deadline
        } = data;

        // ตรวจสอบสิทธิ์: ต้องเป็นประกาศของบริษัทตัวเองเท่านั้น
        const existingPosting = await JobPostingModel.getJobPostingById(id, companyId);
        if (!existingPosting) {
            return null; // ไม่พบประกาศ หรือไม่มีสิทธิ์
        }

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
        if (result.affectedRows === 0) {
            return null; // ไม่มีการเปลี่ยนแปลง หรือไม่พบรายการ
        }
        // ดึงข้อมูลที่อัปเดตแล้วกลับมาพร้อม company_name และ company_status
        return await JobPostingModel.getJobPostingById(id, companyId);
    },

    /**
     * ลบประกาศรับสมัครงาน
     * @param {number} id - ID ของประกาศ
     * @param {number} companyId - ID ของบริษัท (เพื่อตรวจสอบสิทธิ์)
     * @returns {Promise<boolean>} - true ถ้าลบสำเร็จ, false ถ้าไม่พบ/ไม่มีสิทธิ์
     */
    deleteJobPosting: async (id, companyId) => {
        // ตรวจสอบสิทธิ์: ต้องเป็นประกาศของบริษัทตัวเองเท่านั้น
        const existingPosting = await JobPostingModel.getJobPostingById(id, companyId);
        if (!existingPosting) {
            return false; // ไม่พบประกาศ หรือไม่มีสิทธิ์
        }

        const sql = `DELETE FROM job_postings WHERE job_posting_id = ? AND company_id = ?`;
        const result = await query(sql, [id, companyId]);
        return result.affectedRows > 0;
    },
};

module.exports = JobPostingModel;
