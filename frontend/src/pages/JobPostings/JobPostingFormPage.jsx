// frontend/src/pages/JobPostings/JobPostingFormPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // ตรวจสอบให้แน่ใจว่า path ถูกต้อง
import { Form, Button, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimesCircle, faArrowLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

function JobPostingFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        job_title: '',
        job_description: '',
        qualifications_text: '',
        salary_min: '',
        salary_max: '',
        job_status: 'draft',
        jobpos_id: '',
        posted_at: new Date().toISOString().slice(0, 10), // Default to current date for new posts

        // --- เพิ่มฟิลด์ใหม่จากฐานข้อมูล ---
        job_location_text: '',
        contact_person_name: '',
        contact_phone: '',
        contact_email: '',
        contact_address_text: '',
        application_deadline: '', // วันที่
        benefits_text: '', // สวัสดิการ
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [positions, setPositions] = useState([]);

    // Hook สำหรับโหลดข้อมูลตำแหน่งงาน (Job Positions) สำหรับ Dropdown
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await api.get('/positions');
                setPositions(response.data);
            } catch (err) {
                console.error("Failed to fetch positions:", err);
                setError("ไม่สามารถโหลดข้อมูลตำแหน่งงานได้");
            }
        };
        fetchPositions();
    }, []);

    // Hook สำหรับโหลดข้อมูลประกาศรับสมัครงาน เมื่ออยู่ในโหมดแก้ไข
    useEffect(() => {
        if (isEditMode) {
            const fetchJobPosting = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await api.get(`/job-postings/${id}`);
                    const data = response.data;

                    // จัดรูปแบบวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD สำหรับ input type="date"
                    // ตรวจสอบให้แน่ใจว่าข้อมูลวันที่ไม่เป็น null ก่อน slice
                    const postedAt = data.posted_at ? new Date(data.posted_at).toISOString().split('T')[0] : '';
                    const applicationDeadline = data.application_deadline ? new Date(data.application_deadline).toISOString().split('T')[0] : '';


                    setFormData({
                        job_title: data.job_title || '',
                        job_description: data.job_description || '',
                        qualifications_text: data.qualifications_text || '',
                        salary_min: data.salary_min !== null ? String(data.salary_min) : '',
                        salary_max: data.salary_max !== null ? String(data.salary_max) : '',
                        job_status: data.job_status || 'draft',
                        jobpos_id: data.jobpos_id || '',
                        posted_at: postedAt,
                        // --- ดึงข้อมูลฟิลด์ใหม่ ---
                        job_location_text: data.job_location_text || '',
                        contact_person_name: data.contact_person_name || '',
                        contact_phone: data.contact_phone || '',
                        contact_email: data.contact_email || '',
                        contact_address_text: data.contact_address_text || '',
                        application_deadline: applicationDeadline,
                        benefits_text: data.benefits_text || '', // ดึงข้อมูลสวัสดิการ
                    });
                } catch (err) {
                    console.error("Error fetching job posting for edit:", err.response?.data || err.message);
                    setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลประกาศรับสมัครงานนี้ได้");
                } finally {
                    setLoading(false);
                }
            };
            fetchJobPosting();
        } else {
            // ถ้าอยู่ในโหมดเพิ่ม ให้ตั้งค่าฟอร์มเริ่มต้นและหยุดโหลด
            setFormData({
                job_title: '',
                job_description: '',
                qualifications_text: '',
                salary_min: '',
                salary_max: '',
                job_status: 'draft',
                jobpos_id: '',
                posted_at: new Date().toISOString().slice(0, 10),
                // --- ตั้งค่าเริ่มต้นสำหรับฟิลด์ใหม่ในโหมดเพิ่ม ---
                job_location_text: '',
                contact_person_name: '',
                contact_phone: '',
                contact_email: '',
                contact_address_text: '',
                application_deadline: '',
                benefits_text: '', // ตั้งค่าเริ่มต้นสำหรับฟิลด์ใหม่ในโหมดเพิ่ม
            });
            setLoading(false);
        }
    }, [id, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const dataToSend = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                jobpos_id: formData.jobpos_id ? parseInt(formData.jobpos_id) : null,
                // --- แปลงฟิลด์วันที่ให้เป็น null ถ้าว่าง ก่อนส่ง ---
                posted_at: formData.posted_at || null,
                application_deadline: formData.application_deadline || null,
            };

            if (isEditMode) {
                await api.put(`/job-postings/${id}`, dataToSend);
                setSuccess('แก้ไขประกาศรับสมัครงานสำเร็จ!');
            } else {
                await api.post('/job-postings', dataToSend);
                setSuccess('สร้างประกาศรับสมัครงานสำเร็จ!');
            }
            navigate('/job-postings');
        } catch (err) {
            console.error("Error submitting job posting:", err.response?.data || err.message);
            setError(err.response?.data?.message || `เกิดข้อผิดพลาดในการ${isEditMode ? 'บันทึกการแก้ไข' : 'สร้างประกาศรับสมัครงาน'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && isEditMode) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error && (isEditMode || !submitting)) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">{isEditMode ? 'แก้ไขประกาศรับสมัครงาน' : 'สร้างประกาศรับสมัครงานใหม่'}</h4>
                <Button variant="outline-secondary" onClick={() => navigate('/job-postings')}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> กลับไปยังรายการ
                </Button>
            </div>
            

            {success && <Alert variant="success">{success}</Alert>}

            <Form onSubmit={handleSubmit} className="card p-4 shadow-sm">
                <Form.Group className="mb-3">
                    <Form.Label>ชื่อตำแหน่งที่ประกาศ <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        name="job_title"
                        value={formData.job_title}
                        onChange={handleChange}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>ตำแหน่งในระบบ (สำหรับกรองข้อมูล) <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        name="jobpos_id"
                        value={formData.jobpos_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">เลือกตำแหน่ง</option>
                        {positions.map(pos => (
                            <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>รายละเอียดงาน <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={5}
                        name="job_description"
                        value={formData.job_description}
                        onChange={handleChange}
                        required
                        placeholder="อธิบายรายละเอียดงาน หน้าที่ความรับผิดชอบ"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>คุณสมบัติผู้สมัคร</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        name="qualifications_text"
                        value={formData.qualifications_text}
                        onChange={handleChange}
                        placeholder="ระบุคุณสมบัติที่ต้องการ เช่น การศึกษา ประสบการณ์ ทักษะที่จำเป็น"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>สวัสดิการ</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        name="benefits_text"
                        value={formData.benefits_text}
                        onChange={handleChange}
                        placeholder="ระบุสวัสดิการ (เช่น โบนัส, ประกันสังคม, ... )"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>สถานที่ทำงาน</Form.Label>
                    <Form.Control
                        type="text"
                        name="job_location_text"
                        value={formData.job_location_text}
                        onChange={handleChange}
                        placeholder="เช่น กรุงเทพมหานคร, ชลบุรี"
                    />
                </Form.Group>

                <div className="row mb-3">
                    <Form.Group className="col-md-6">
                        <Form.Label>เงินเดือนขั้นต่ำ (บาท)</Form.Label>
                        <Form.Control
                            type="number"
                            name="salary_min"
                            value={formData.salary_min}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                        <Form.Label>เงินเดือนขั้นสูงสุด (บาท)</Form.Label>
                        <Form.Control
                            type="number"
                            name="salary_max"
                            value={formData.salary_max}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </div>

                <hr className="my-4" /> {/* คั่นส่วนข้อมูลติดต่อ */}
                <h5 className="mb-3">ข้อมูลผู้ติดต่อ</h5>

                <Form.Group className="mb-3">
                    <Form.Label>ชื่อผู้ติดต่อ</Form.Label>
                    <Form.Control
                        type="text"
                        name="contact_person_name"
                        value={formData.contact_person_name}
                        onChange={handleChange}
                    />
                </Form.Group>

                <div className="row mb-3">
                    <Form.Group className="col-md-6">
                        <Form.Label>เบอร์โทรศัพท์ผู้ติดต่อ</Form.Label>
                        <Form.Control
                            type="text"
                            name="contact_phone"
                            value={formData.contact_phone}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                        <Form.Label>อีเมลผู้ติดต่อ</Form.Label>
                        <Form.Control
                            type="email"
                            name="contact_email"
                            value={formData.contact_email}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </div>

                <Form.Group className="mb-3">
                    <Form.Label>ที่อยู่ติดต่อ</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={2}
                        name="contact_address_text"
                        value={formData.contact_address_text}
                        onChange={handleChange}
                    />
                </Form.Group>

                <hr className="my-4" /> {/* คั่นส่วนสถานะและวันที่ */}

                <Form.Group className="mb-3">
                    <Form.Label>สถานะประกาศ <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        name="job_status"
                        value={formData.job_status}
                        onChange={handleChange}
                        required
                    >
                        <option value="draft">ฉบับร่าง</option>
                        <option value="active">เปิดรับสมัคร</option>
                        <option value="closed">ปิดรับสมัคร</option>
                    </Form.Select>
                </Form.Group>

                <div className="row mb-3">
                    <Form.Group className="col-md-6">
                        <Form.Label>วันที่ประกาศ</Form.Label>
                        <Form.Control
                            type="date"
                            name="posted_at"
                            value={formData.posted_at}
                            onChange={handleChange}
                        />
                    </Form.Group>
                    <Form.Group className="col-md-6">
                        <Form.Label>วันสุดท้ายที่รับสมัคร</Form.Label>
                        <Form.Control
                            type="date"
                            name="application_deadline"
                            value={formData.application_deadline}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </div>

                <div className="d-flex justify-content-end mt-4">
                    <Button variant="success" type="submit" className="me-2" disabled={submitting}>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        {submitting ? 'กำลังบันทึก...' : (isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกประกาศ')}
                    </Button>
                    <Button variant="secondary" onClick={() => navigate('/job-postings')} disabled={submitting}>
                        <FontAwesomeIcon icon={faTimesCircle} className="me-2" /> ยกเลิก
                    </Button>
                </div>
            </Form>
        </div>
    );
}

export default JobPostingFormPage;