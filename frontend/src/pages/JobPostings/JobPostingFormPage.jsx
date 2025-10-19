// ฟอร์มสร้าง/แก้ไข "ประกาศรับสมัครงาน" (หน้าเดียวใช้ได้ทั้งโหมดเพิ่มและแก้ไข)

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // instance ของ axios ที่ตั้งค่า baseURL/token ไว้แล้ว
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faTimesCircle, faArrowLeft, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

function JobPostingFormPage() {
    const { id } = useParams();      // ดึง id จาก URL ถ้ามี = โหมดแก้ไข, ถ้าไม่มี = โหมดเพิ่ม
    const navigate = useNavigate();
    const isEditMode = !!id;         // flag บอกว่าอยู่โหมดแก้ไขไหม

    // เก็บค่าฟอร์มทั้งหมด (ผูกกับ input ต่าง ๆ)
    const [formData, setFormData] = useState({
        job_title: '',
        job_description: '',
        qualifications_text: '',
        salary_min: '',
        salary_max: '',
        job_status: 'draft',                    
        jobpos_id: '',
        posted_at: new Date().toISOString().slice(0, 10), // ค่า default = วันนี้ (YYYY-MM-DD)

        // ฟิลด์เพิ่มเติม
        job_location_text: '',
        contact_person_name: '',
        contact_phone: '',
        contact_email: '',
        contact_address_text: '',
        application_deadline: '',   // วันสิ้นสุดรับสมัคร
        benefits_text: '',          // สวัสดิการ (multi-line)
    });

    // state สำหรับ UI
    const [loading, setLoading] = useState(true);     // โหลดตอนเริ่ม (เฉพาะโหมดแก้ไข)
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);         // แสดง error ด้านบนฟอร์ม
    const [success, setSuccess] = useState(null);     // แสดง success (แว้บเดียวก่อน navigate)
    const [positions, setPositions] = useState([]);   // รายการตำแหน่งในระบบ (dropdown)

    //  ดึง "ตำแหน่งงาน" มาเติมใน dropdown
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await api.get('/positions'); // GET /positions
                setPositions(response.data);                  // เก็บรายการตำแหน่ง
            } catch (err) {
                console.error("Failed to fetch positions:", err);
                setError("ไม่สามารถโหลดข้อมูลตำแหน่งงานได้");
            }
        };
        fetchPositions();
    }, []);

    // ถ้าโหมดแก้ไข: ดึงรายละเอียดประกาศมาเติมฟอร์ม 
    useEffect(() => {
        if (isEditMode) {
            const fetchJobPosting = async () => {
                setLoading(true);
                setError(null);
                try {
                    const response = await api.get(`/job-postings/${id}`); // GET ประกาศตาม id
                    const data = response.data;

                    // แปลงวันที่ให้อยู่ในรูปแบบ YYYY-MM-DD (input type="date" ต้องการรูปนี้)
                    const postedAt = data.posted_at ? new Date(data.posted_at).toISOString().split('T')[0] : '';
                    const applicationDeadline = data.application_deadline ? new Date(data.application_deadline).toISOString().split('T')[0] : '';

                    // เติมค่าลงฟอร์ม (เผื่อค่า null ให้เป็น '' ป้องกัน warning)
                    setFormData({
                        job_title: data.job_title || '',
                        job_description: data.job_description || '',
                        qualifications_text: data.qualifications_text || '',
                        salary_min: data.salary_min !== null ? String(data.salary_min) : '',
                        salary_max: data.salary_max !== null ? String(data.salary_max) : '',
                        job_status: data.job_status || 'draft',
                        jobpos_id: data.jobpos_id || '',
                        posted_at: postedAt,
                        job_location_text: data.job_location_text || '',
                        contact_person_name: data.contact_person_name || '',
                        contact_phone: data.contact_phone || '',
                        contact_email: data.contact_email || '',
                        contact_address_text: data.contact_address_text || '',
                        application_deadline: applicationDeadline,
                        benefits_text: data.benefits_text || '',
                    });
                } catch (err) {
                    console.error("Error fetching job posting for edit:", err.response?.data || err.message);
                    setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลประกาศรับสมัครงานนี้ได้");
                } finally {
                    setLoading(false); // จบโหลด
                }
            };
            fetchJobPosting();
        } else {
            // โหมดเพิ่ม: reset ค่าเริ่มต้น (กัน edge case เวลาเปลี่ยนเส้นทางจากหน้าแก้ไข)
            setFormData({
                job_title: '',
                job_description: '',
                qualifications_text: '',
                salary_min: '',
                salary_max: '',
                job_status: 'draft',
                jobpos_id: '',
                posted_at: new Date().toISOString().slice(0, 10),
                job_location_text: '',
                contact_person_name: '',
                contact_phone: '',
                contact_email: '',
                contact_address_text: '',
                application_deadline: '',
                benefits_text: '',
            });
            setLoading(false);
        }
    }, [id, isEditMode]);

    // อัปเดตค่า state เมื่อผู้ใช้พิมพ์ในฟอร์ม
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value })); // ผูกชื่่อ input -> key ใน formData
    };

    // ส่งฟอร์ม (สร้าง/แก้ไข)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            // เตรียมข้อมูลก่อนยิง API (แปลง number/date ให้ถูกชนิด)
            const dataToSend = {
                ...formData,
                salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
                salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
                jobpos_id: formData.jobpos_id ? parseInt(formData.jobpos_id) : null,
                posted_at: formData.posted_at || null,
                application_deadline: formData.application_deadline || null,
            };

            if (isEditMode) {
                // PUT ปรับปรุงประกาศเดิม
                await api.put(`/job-postings/${id}`, dataToSend);
                setSuccess('แก้ไขประกาศรับสมัครงานสำเร็จ!');
            } else {
                // POST สร้างประกาศใหม่
                await api.post('/job-postings', dataToSend);
                setSuccess('สร้างประกาศรับสมัครงานสำเร็จ!');
            }

            // ไปหน้ารายการประกาศ
            navigate('/job-postings');
        } catch (err) {
            console.error("Error submitting job posting:", err.response?.data || err.message);
            setError(
                err.response?.data?.message ||
                `เกิดข้อผิดพลาดในการ${isEditMode ? 'บันทึกการแก้ไข' : 'สร้างประกาศรับสมัครงาน'}`
            );
        } finally {
            setSubmitting(false);
        }
    };

    // สถานะโหลด/เออเรอร์ตอนแก้ไข
    if (loading && isEditMode)
        return <div className="text-center mt-5"><Spinner animation="border" /> กำลังโหลดข้อมูล...</div>;

    if (error && (isEditMode || !submitting))
        return (
            <Alert variant="danger" className="mt-5 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                {error}
            </Alert>
        );

    return (
        <div>
            {/* ชื่อหน้า + ปุ่มย้อนกลับ */}
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>
                {isEditMode ? 'แก้ไขประกาศรับสมัครงาน' : 'สร้างประกาศรับสมัครงานใหม่'}
            </h4>
            <div className="d-flex justify-content-start align-items-center mb-3">
                <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
                </Button>
            </div>

            {/* แจ้งสำเร็จ (เผื่อกรณีอยู่หน้าฟอร์มต่อ) */}
            {success && <Alert variant="success" className="mt-4">{success}</Alert>}

            {/* ฟอร์มหลัก */}
            <Form onSubmit={handleSubmit} className="card p-4 shadow-sm mt-4">

                {/* ชื่อตำแหน่ง */}
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

                {/* ผูกกับตำแหน่งในระบบ (ใช้ jobpos_id) */}
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

                {/* รายละเอียดงาน */}
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

                {/* คุณสมบัติ  */}
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

                {/* สวัสดิการ */}
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

                {/* สถานที่ทำงาน  */}
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

                {/* เงินเดือนขั้นต่ำ/สูงสุด */}
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

                <hr className="my-4" />
                <h5 className="mb-3">ข้อมูลผู้ติดต่อ</h5>

                {/* ผู้ติดต่อ/ช่องทาง */}
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

                <hr className="my-4" />

                {/* สถานะประกาศ */}
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

                {/* วันที่ประกาศ/วันสุดท้ายที่รับสมัคร */}
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

                {/* ปุ่มบันทึก/ยกเลิก */}
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
