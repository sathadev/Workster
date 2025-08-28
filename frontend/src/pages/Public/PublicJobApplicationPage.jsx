// frontend/src/pages/Public/PublicJobApplicationPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink, Link } from 'react-router-dom';
import { publicApi } from '../../api/axios';
import { Form, Button, Alert, Card, Spinner, Row, Col, Container, Navbar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './PublicJobApplicationPage.css';

const PublicNavbar = () => {
    return (
        <Navbar expand="lg" variant="dark" className="ws-navbar sticky-top" style={{ backgroundColor: 'rgb(33, 37, 41)' }}>
            <Container>
                <NavLink className="navbar-brand" to="/" aria-label="WorkSter Home">
                    WorkSter
                </NavLink>
                <Navbar.Toggle aria-controls="regNav" />
                <Navbar.Collapse id="regNav">
                    <ul className="navbar-nav ms-auto align-items-lg-center">
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
    const { id } = useParams();
    const navigate = useNavigate();
    const [jobTitle, setJobTitle] = useState('');

    const [formData, setFormData] = useState({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        resume_file: null,
        other_links_text: '',
        cover_letter_text: '',
        expected_salary: '',
        available_start_date: '',
        consent_privacy: false
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch job title to display on the form
    useEffect(() => {
        const fetchJobTitle = async () => {
            try {
                const res = await publicApi.get(`/job-postings/public/${id}`);
                setJobTitle(res.data.job_title);
            } catch (err) {
                console.error("Failed to fetch job title:", err);
            }
        };
        fetchJobTitle();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'file') {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

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

        const dataToSubmit = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) {
                dataToSubmit.append(key, formData[key]);
            }
        });
        
        // Use the correct endpoint based on the ID
        try {
            const response = await publicApi.post(`/job-applications/${id}`, dataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(response.data.message);
            setTimeout(() => {
                navigate(`/public/job-postings`);
            }, 3000);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งใบสมัคร';
            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ fontFamily: '"Noto Sans Thai", sans-serif', background: '#f0f2f5', minHeight: '100vh' }}>
            <PublicNavbar />
            <Container className="py-5">
                <Card className="shadow-lg p-4">
                    <Card.Body>
                        <h2 className="fw-bold mb-1 text-primary">สมัครงาน</h2>
                        <h4 className="fw-bold mb-4 text-secondary">{jobTitle}</h4>
                        <hr className="mb-4" />
                        {error && <Alert variant="danger"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>}
                        {success && <Alert variant="success"><FontAwesomeIcon icon={faCheckCircle} className="me-2" />{success}</Alert>}
                        
                        <Form onSubmit={handleSubmit}>
                            <Row className="mb-3">
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="text" name="applicant_name" value={formData.applicant_name} onChange={handleChange} required />
                                </Form.Group>
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">อีเมล <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="email" name="applicant_email" value={formData.applicant_email} onChange={handleChange} required />
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">เบอร์โทรศัพท์ <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="tel" name="applicant_phone" value={formData.applicant_phone} onChange={handleChange} required />
                                </Form.Group>
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">อัปโหลด Resume/CV <span className="text-danger">*</span></Form.Label>
                                    <Form.Control type="file" name="resume_file" onChange={handleChange} accept=".pdf,.doc,.docx" required />
                                </Form.Group>
                            </Row>
                            <Row className="mb-3">
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">เงินเดือนที่คาดหวัง (บาท)</Form.Label>
                                    <Form.Control type="number" name="expected_salary" value={formData.expected_salary} onChange={handleChange} />
                                </Form.Group>
                                <Form.Group as={Col} md={6}>
                                    <Form.Label className="fw-bold">วันที่เริ่มงานที่พร้อม</Form.Label>
                                    <Form.Control type="date" name="available_start_date" value={formData.available_start_date} onChange={handleChange} />
                                </Form.Group>
                            </Row>
                            <Form.Group className="mb-3">
                                <Form.Label className="fw-bold">ลิงก์อื่นๆ (เช่น Portfolio, LinkedIn)</Form.Label>
                                <Form.Control as="textarea" rows={3} name="other_links_text" value={formData.other_links_text} onChange={handleChange} />
                            </Form.Group>
                            
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
                            
                            <div className="d-flex justify-content-end">
                                <Button variant="primary" type="submit" disabled={submitting} className="py-2 px-4 fw-bold">
                                    {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : <FontAwesomeIcon icon={faPaperPlane} className="me-2" />}
                                    ส่งใบสมัคร
                                </Button>
                            </div>
                        </Form>
                    </Card.Body>
                </Card>
            </Container>
            <footer className="bg-dark text-white text-center py-3 mt-5">
                <p className="mb-0">&copy; 2025 WorkSter. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default PublicJobApplicationPage;