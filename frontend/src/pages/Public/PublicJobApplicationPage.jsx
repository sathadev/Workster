// frontend/src/pages/Public/PublicJobApplicationPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink, Link } from 'react-router-dom';
import { publicApi } from '../../api/axios'; // axios instance สำหรับ endpoint public (ไม่ต้องมี token)
import { Form, Button, Alert, Card, Spinner, Row, Col, Container, Navbar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './PublicJobApplicationPage.css'; // ไฟล์สไตล์เฉพาะหน้านี้

// Navbar แบบ Public
// ใช้ Navbar ของ react-bootstrap + NavLink ของ react-router
const PublicNavbar = () => {
    return (
        <Navbar
          expand="lg"
          variant="dark"
          className="ws-navbar sticky-top"
          style={{ backgroundColor: 'rgb(33, 37, 41)' }}
        >
            <Container>
                {/* โลโก้/ชื่อเว็บ กดแล้วกลับหน้า Home */}
                <NavLink className="navbar-brand" to="/" aria-label="WorkSter Home">
                    WorkSter
                </NavLink>

                {/* ปุ่ม toggle แสดงเมนูเมื่อจอเล็ก */}
                <Navbar.Toggle aria-controls="regNav" />
                <Navbar.Collapse id="regNav">
                    <ul className="navbar-nav ms-auto align-items-lg-center">
                        {/* ปุ่มไปหน้าเข้าสู่ระบบ */}
                        <li className="nav-item me-lg-2">
                            <NavLink to="/login" className="btn btn-outline-light ws-btn">
                                เข้าสู่ระบบ
                            </NavLink>
                        </li>
                    </ul>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

function PublicJobApplicationPage() {
    //  Routing & Navigation-
    const { id } = useParams();          // รับ job posting id จาก URL
    const navigate = useNavigate();      // ใช้เปลี่ยนหน้าเมื่อส่งใบสมัครเสร็จ

    //  UI: ชื่อประกาศงาน
    const [jobTitle, setJobTitle] = useState('');

    //  ฟอร์มสมัครงาน (state รวมทุกช่อง)
    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        resume_file: null,          // ไฟล์แนบ (Resume/CV)
        other_links_text: '',       // ช่องใส่ลิงก์พอร์ต/LinkedIn ฯลฯ
        cover_letter_text: '',      // (สำรองเผื่อใช้งาน/ขยายเพิ่ม)
        expected_salary: '',
        available_start_date: '',
        consent_privacy: false      //  ยอมรับนโยบายความเป็นส่วนตัว 
    });

    // สถานะ UI ระหว่างส่ง/ผลลัพธ์ 
    const [submitting, setSubmitting] = useState(false); //  ป้องกันคลิกซ้ำตอนส่ง
    const [error, setError] = useState(null);            //  ข้อความผิดพลาด
    const [success, setSuccess] = useState(null);        // ข้อความสำเร็จ

    // ดึงชื่อประกาศงานมาโชว์ 
    useEffect(() => {
        const fetchJobTitle = async () => {
            try {
                // GET ข้อมูลประกาศงานแบบ public ตาม id
                const res = await publicApi.get(`/job-postings/public/${id}`);
                setJobTitle(res.data.job_title); // เก็บชื่อไว้แสดงหัวฟอร์ม
            } catch (err) {
                console.error("Failed to fetch job title:", err);
                // ไม่ต้อง setError เพราะยังสมัครได้แม้ไม่มีชื่อ (แล้วแต่ต้องการ)
            }
        };
        fetchJobTitle();
    }, [id]);

    // อัปเดตค่าฟอร์มตามการพิมพ์/เลือกไฟล์/ติ๊กเช็คบ็อกซ์ 
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;

        // จัดการตามชนิด input
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked })); // true/false
        } else if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] })); // เก็บไฟล์ตัวแรก
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));    
        }
    };

    // ส่งฟอร์มสมัครงาน 
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        // ตรวจสอบเงื่อนไขขั้นต่ำก่อนส่ง
        if (!formData.resume_file) {
            setError('กรุณาแนบไฟล์ Resume/CV');
            setSubmitting(false);
            return;
        }
        if (!formData.consent_privacy) {
            setError('กรุณายอมรับนโยบายความเป็นส่วนตัว');
            setSubmitting(false);
            return;
        }

        // สร้าง FormData เพื่อรองรับการอัปโหลดไฟล์ (multipart/form-data)
        const dataToSubmit = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                dataToSubmit.append(key, formData[key]); // แนบทุกฟิลด์ (รวมไฟล์)
            }
        });
        
        try {
            // POST ไป endpoint สมัครงาน โดยอ้างอิง job id
            const response = await publicApi.post(
                `/job-applications/${id}`,
                dataToSubmit,
                { headers: { 'Content-Type': 'multipart/form-data' } } // ต้องระบุ header สำหรับอัปโหลดไฟล์
            );

            // แสดงข้อความสำเร็จจาก backend (เช่น "ส่งใบสมัครสำเร็จ")
            setSuccess(response.data.message);

            // รอ 3 วิ แล้วพากลับหน้า "รายการงาน"
            setTimeout(() => {
                navigate(`/public/job-postings`);
            }, 3000);
        } catch (err) {
            // ถ้า backend ส่ง message ก็ใช้, ไม่งั้นข้อความดีฟอลต์
            const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งใบสมัคร';
            setError(errorMessage);
        } finally {
            setSubmitting(false); // ปลดล็อกปุ่มไม่ให้ค้าง disabled
        }
    };

    // UI หลักของหน้า (โทนสว่าง + ฟอร์มใน Card) 
    return (
        <div
          style={{
            fontFamily: '"Noto Sans Thai", sans-serif',
            background: "#f0f2f5",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
        >
            <PublicNavbar />

            {/* คอนเทนเนอร์หลักของหน้า (ยืดเต็มความสูงที่เหลือ) */}
            <Container className="py-5" style={{ flex: 1 }}>
                <Card className="shadow-lg p-4">
                    <Card.Body>
                        {/* หัวเรื่อง + ชื่อประกาศงาน */}
                        <h2 className="fw-bold mb-1 text-primary">สมัครงาน</h2>
                        <h4 className="fw-bold mb-4 text-secondary">{jobTitle}</h4>
                        <hr className="mb-4" />

                        {/* แถบแจ้งเตือน error/success */}
                        {error && (
                          <Alert variant="danger">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                            {error}
                          </Alert>
                        )}
                        {success && (
                          <Alert variant="success">
                            <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
                            {success}
                          </Alert>
                        )}
                        
                        {/* ฟอร์มสมัครงาน */}
                        <Form onSubmit={handleSubmit}>
                            {/* แถว 1: ชื่อ-นามสกุล, อีเมล */}
                            <Row className="mb-3">
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">
                                      ชื่อ-นามสกุล <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="applicant_name"
                                      value={formData.applicant_name}
                                      onChange={handleChange}
                                      required // ต้องกรอก
                                    />
                                </Form.Group>

                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">
                                      อีเมล <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                      type="email"
                                      name="applicant_email"
                                      value={formData.applicant_email}
                                      onChange={handleChange}
                                      required
                                    />
                                </Form.Group>
                            </Row>

                            {/* แถว 2: เบอร์โทร, แนบไฟล์เรซูเม่ */}
                            <Row className="mb-3">
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">
                                      เบอร์โทรศัพท์ <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                      type="tel"
                                      name="applicant_phone"
                                      value={formData.applicant_phone}
                                      onChange={handleChange}
                                      required
                                    />
                                </Form.Group>

                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">
                                      อัปโหลด Resume/CV <span className="text-danger">*</span>
                                    </Form.Label>
                                    <Form.Control
                                      type="file"
                                      name="resume_file"
                                      onChange={handleChange}
                                      accept=".pdf,.doc,.docx" // จำกัดชนิดไฟล์
                                      required
                                    />
                                </Form.Group>
                            </Row>

                            {/* แถว 3: เงินเดือนที่คาดหวัง, วันที่เริ่มงานได้ */}
                            <Row className="mb-3">
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">เงินเดือนที่คาดหวัง (บาท)</Form.Label>
                                    <Form.Control
                                      type="number"
                                      name="expected_salary"
                                      value={formData.expected_salary}
                                      onChange={handleChange}
                                    />
                                </Form.Group>

                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">วันที่เริ่มงานที่พร้อม</Form.Label>
                                    <Form.Control
                                      type="date"
                                      name="available_start_date"
                                      value={formData.available_start_date}
                                      onChange={handleChange}
                                    />
                                </Form.Group>
                            </Row>

                            {/* ลิงก์อื่น ๆ (เช่น พอร์ต/LinkedIn) */}
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">ลิงก์อื่นๆ (เช่น Portfolio, LinkedIn)</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={3}
                                  name="other_links_text"
                                  value={formData.other_links_text}
                                  onChange={handleChange}
                                />
                            </Form.Group>
                            
                            {/* ติ๊กยอมรับนโยบายความเป็นส่วนตัว (ต้องติ๊ก) */}
                            <Form.Group className="mb-4" controlId="formBasicCheckbox">
                                <Form.Check 
                                    type="checkbox"
                                    label="ฉันยอมรับนโยบายความเป็นส่วนตัว"
                                    name="consent_privacy"
                                    checked={formData.consent_privacy}
                                    onChange={handleChange}
                                    required
                                />
                            </Form.Group>
                            
                            {/* ปุ่มส่งใบสมัคร (disabled ระหว่าง submitting) */}
                            <div className="d-flex justify-content-end">
                                <Button
                                  variant="primary"
                                  type="submit"
                                  disabled={submitting}
                                  className="py-2 px-4 fw-bold"
                                >
                                    {/* แสดง spinner ระหว่างส่ง ไม่งั้นแสดงไอคอนเครื่องบินกระดาษ */}
                                    {submitting
                                      ? <Spinner animation="border" size="sm" className="me-2" />
                                      : <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                    }
                                    ส่งใบสมัคร
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>

            {/* ฟุทเตอร์เว็บไซต์ */}
            <footer className="bg-dark text-white text-center py-3 mt-5">
                <p className="mb-0">&copy; 2025 WorkSter. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default PublicJobApplicationPage;
