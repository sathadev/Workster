import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicApi } from '../../api/axios'; // ใช้ publicApi
import { Form, Button, Alert, Card, Spinner, Row, Col } from 'react-bootstrap'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faExclamationTriangle, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import './PublicJobApplicationPage.css';

function PublicJobApplicationPage() {
    const { id } = useParams(); // id ของ Job Posting
    const navigate = useNavigate();

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
        <div className="job-application-container">
            <Card className="shadow-sm p-4">
                <h4 className="fw-bold mb-3">แบบฟอร์มสมัครงาน</h4>
                {error && <Alert variant="danger"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>}
                {success && <Alert variant="success"><FontAwesomeIcon icon={faCheckCircle} className="me-2" />{success}</Alert>}
                
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>ชื่อ-นามสกุล <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="text" name="applicant_name" value={formData.applicant_name} onChange={handleChange} required />
                    </Form.Group>
                    <Row className="mb-3">
                        <Form.Group as={Col} controlId="formEmail">
                            <Form.Label>อีเมล <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="email" name="applicant_email" value={formData.applicant_email} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group as={Col} controlId="formPhone">
                            <Form.Label>เบอร์โทรศัพท์ <span className="text-danger">*</span></Form.Label>
                            <Form.Control type="tel" name="applicant_phone" value={formData.applicant_phone} onChange={handleChange} required />
                        </Form.Group>
                    </Row>
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label>อัปโหลด Resume/CV (PDF, DOC, DOCX) <span className="text-danger">*</span></Form.Label>
                        <Form.Control type="file" name="resume_file" onChange={handleChange} accept=".pdf,.doc,.docx" required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>เงินเดือนที่คาดหวัง (บาท)</Form.Label>
                        <Form.Control type="number" name="expected_salary" value={formData.expected_salary} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>วันที่เริ่มงานที่พร้อม</Form.Label>
                        <Form.Control type="date" name="available_start_date" value={formData.available_start_date} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>ลิงก์อื่นๆ (เช่น Portfolio, LinkedIn)</Form.Label>
                        <Form.Control as="textarea" rows={3} name="other_links_text" value={formData.other_links_text} onChange={handleChange} />
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="formBasicCheckbox">
                        <Form.Check 
                            type="checkbox" 
                            label="ฉันยอมรับนโยบายความเป็นส่วนตัว" 
                            name="consent_privacy"
                            checked={formData.consent_privacy}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    
                    <Button variant="success" type="submit" disabled={submitting} className="w-100 mt-3">
                        {submitting ? <Spinner animation="border" size="sm" className="me-2" /> : ''}
                        ส่งใบสมัคร
                    </Button>
                </Form>
            </Card>
        </div>
    );
}

export default PublicJobApplicationPage;