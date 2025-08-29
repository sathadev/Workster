// frontend/src/pages/hr/HrApplicantDetailPage.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Row, Col, Button, Spinner, Alert, Form, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faUser,
    faBriefcase,
    faMoneyBillWave,
    faCalendarAlt,
    faLink,
    faFileAlt,
    faPhone,
    faEnvelope,
    faPaperPlane,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

// เพิ่ม CSS สำหรับ custom select
const customSelectStyle = (status) => {
    let backgroundColor = "#6c757d"; // default gray
    switch (status) {
        case "rejected":
            backgroundColor = "#dc3545"; // Red
            break;
        case "hired":
            backgroundColor = "#198754"; // Green
            break;
        case "pending":
            backgroundColor = "#ffc107"; // Yellow
            break;
        case "reviewed":
            backgroundColor = "#0d6efd"; // Dark Blue
            break;
        default:
            break;
    }

    // The key here is to set a solid background and color.
    return {
        backgroundColor: backgroundColor,
        color: "#fff", // This makes both text and the default caret white
        borderColor: backgroundColor, // Match border color
        fontSize: '0.95rem',
        paddingRight: '2rem', // Add space for the caret so it doesn't overlap text
        appearance: 'none', // Hide the default browser caret for more control
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px 12px',
    };
};

function HrApplicantDetailPage() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // interviews
    const [interviews, setInterviews] = useState([]);
    const [ivForm, setIvForm] = useState({
        scheduled_at: '',
        method: 'online',
        location_or_link: '',
        notes: '',
    });
    const [ivLoading, setIvLoading] = useState(false);

    // decision
    const [decision, setDecision] = useState('hired'); // 'hired' | 'rejected'
    const [decisionNote, setDecisionNote] = useState('');
    const [sendingDecision, setSendingDecision] = useState(false);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/hr/applicants/${applicationId}`);
            setData(res.data || null);
        } catch (err) {
            console.error('Error fetching applicant detail:', err);
            setError(err?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลผู้สมัครได้');
        } finally {
            setLoading(false);
        }
    }, [applicationId]);

    const fetchInterviews = useCallback(async () => {
        setIvLoading(true);
        try {
            const res = await api.get(`/hr/applicants/${applicationId}/interviews`);
            setInterviews(res.data.items || []);
        } catch (err) {
            console.error('Error fetching interviews:', err);
        } finally {
            setIvLoading(false);
        }
    }, [applicationId]);

    useEffect(() => {
        fetchDetail();
        fetchInterviews();
    }, [fetchDetail, fetchInterviews]);

    const isFinalized = data?.is_finalized === 1 || data?.is_finalized === true;
    const isHired = (data?.application_status === 'hired') || (isFinalized && data?.application_status === 'hired');

    const changeStatus = async (newStatus) => {
        if (isFinalized) {
            alert('ใบสมัครนี้ถูกปิดการดำเนินการแล้ว ไม่สามารถแก้สถานะได้');
            return;
        }
        setIsUpdating(true);
        try {
            await api.patch(`/hr/applicants/${applicationId}/status`, { status: newStatus });
            setData((prev) => ({ ...prev, application_status: newStatus }));
            alert('อัปเดตสถานะสำเร็จ!');
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err?.response?.data?.message || 'อัปเดตสถานะไม่สำเร็จ');
        } finally {
            setIsUpdating(false);
        }
    };

    const scheduleInterview = async (e) => {
        e.preventDefault();
        if (isFinalized) return alert('ใบสมัครนี้ถูกปิดการดำเนินการแล้ว ไม่สามารถนัดสัมภาษณ์ได้');
        if (!ivForm.scheduled_at) return alert('กรุณาเลือกวันและเวลา');

        try {
            setIvLoading(true);
            await api.post(`/hr/applicants/${applicationId}/interviews`, ivForm);
            await fetchInterviews();
            alert('บันทึกและส่งอีเมลนัดสัมภาษณ์แล้ว');
            setIvForm({ scheduled_at: '', method: 'online', location_or_link: '', notes: '' });
        } catch (err) {
            console.error('scheduleInterview error:', err);
            alert(err?.response?.data?.message || 'ไม่สามารถนัดสัมภาษณ์ได้');
        } finally {
            setIvLoading(false);
        }
    };

    const sendDecision = async () => {
        if (isFinalized) return alert('ใบสมัครนี้ถูกปิดการดำเนินการแล้ว ไม่สามารถส่งผลซ้ำได้');
        if (!window.confirm(`ยืนยันส่งผล "${decision === 'hired' ? 'ผ่าน' : 'ไม่ผ่าน'}" ถึงผู้สมัครทางอีเมล?`)) return;
        try {
            setSendingDecision(true);
            await api.patch(`/hr/applicants/${applicationId}/decision`, {
                decision,
                note: decisionNote || undefined,
            });
            alert('ส่งอีเมลผลการพิจารณาแล้ว');
            // อัปเดต UI ทันทีให้ล็อกทุกอย่าง
            setData((prev) => ({
                ...prev,
                application_status: decision,
                is_finalized: 1,
            }));
        } catch (err) {
            console.error('sendDecision error:', err);
            alert(err?.response?.data?.message || 'ส่งผลการพิจารณาไม่สำเร็จ');
        } finally {
            setSendingDecision(false);
        }
    };

    // === NEW: ส่งต่อไปหน้าเพิ่มพนักงาน พร้อม prefill ===
    const toDateInput = (v) => {
        if (!v) return '';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    };

    const buildEmployeePrefill = () => {
        const name = (data?.applicant_name || '').trim();
        const parts = name.split(/\s+/);
        const first_name = parts[0] || '';
        const last_name = parts.slice(1).join(' ') || '';

        const resumeHref =
            data?.resume_filepath
                ? (data.resume_filepath.startsWith('/uploads')
                    ? `${API_BASE}${data.resume_filepath}`
                    : `${API_BASE}/uploads/resumes/${data.resume_filepath}`)
                : '';

        return {
            first_name,
            last_name,
            full_name: name,
            email: data?.applicant_email || '',
            phone: data?.applicant_phone || '',
            position_name: data?.job_title || '',
            start_date: toDateInput(data?.available_start_date),
            base_salary: typeof data?.expected_salary === 'number' ? data.expected_salary : '',
            source_application_id: data?.application_id,
            resume_url: resumeHref,
        };
    };

    const goAddEmployee = () => {
        const prefill = buildEmployeePrefill();
        // เผื่อหน้า Add ไม่ได้รองรับ navigate state ให้เก็บลง localStorage ด้วย
        try { localStorage.setItem('employee_prefill', JSON.stringify(prefill)); } catch { }
        navigate('/employees/add', { state: { prefill } });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('th-TH', {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // --- Helper function to get status color ---
    const getStatusColor = (status) => {
        switch (status) {
            case "rejected":
                return { backgroundColor: "#dc3545", color: "#fff" }; // Red
            case "hired":
                return { backgroundColor: "#198754", color: "#fff" }; // Green
            case "pending":
                return { backgroundColor: "#ffc107", color: "#fff" }; // Yellow
            case "reviewed":
                return { backgroundColor: "#0d6efd", color: "#fff" }; // Dark Blue
            default:
                return { backgroundColor: "#6c757d", color: "#fff" }; // Gray
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center">{error}</Alert>;
    if (!data) return <div className="text-center mt-5">ไม่พบข้อมูลผู้สมัคร</div>;

    const resumeHref = data.resume_filepath
        ? (data.resume_filepath.startsWith('/uploads')
            ? `${API_BASE}${data.resume_filepath}`
            : `${API_BASE}/uploads/resumes/${data.resume_filepath}`)
        : null;

    return (
        <div>
            {/* Title */}
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดผู้สมัคร</h4>

            {/* Breadcrumbs and Back/Add Employee buttons moved here */}
            {/* ใช้ justify-content-end เพื่อจัดให้ไปอยู่ด้านขวา */}
            <div className="d-flex justify-content-start align-items-center mb-3">
                <div className="d-flex gap-2">
                    <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
                        <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
                    </Button>
                    {/* ปุ่มเพิ่มเป็นพนักงาน — ใช้ได้เมื่อผ่าน (hired) */}
                    <Button
                        variant="success"
                        onClick={goAddEmployee}
                        disabled={!isHired}
                        title={isHired ? '' : 'ปุ่มนี้จะกดได้เมื่อผลเป็น “ผ่าน (hired)”'}
                        style={{ fontSize: '1rem' }}
                    >
                        เพิ่มเป็นพนักงาน
                    </Button>
                </div>
            </div>
            {/* Main content container with shadow and padding */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    {isFinalized && (
                        <Alert variant="danger" className="mb-3" style={{ fontSize: '1rem' }}>
                            ใบสมัครนี้ถูก<span className="fw-bold">ปิดการดำเนินการ</span>แล้ว — ไม่สามารถนัดสัมภาษณ์หรือส่งผลพิจารณาได้อีก
                        </Alert>
                    )}

                    {/* Applicant Info Section */}
                    <div className="p-3 mb-4 border rounded">
                        <Row>
                            <Col md={6}>
                                <h5 className="fw-bold mb-3">
                                    <FontAwesomeIcon icon={faUser} className="me-2 text-primary" />
                                    ข้อมูลผู้สมัคร
                                </h5>
                                <p><strong>ชื่อ-นามสกุล:</strong> {data.applicant_name}</p>
                                <p><strong><FontAwesomeIcon icon={faEnvelope} className="me-2" />อีเมล:</strong> {data.applicant_email}</p>
                                <p><strong><FontAwesomeIcon icon={faPhone} className="me-2" />โทรศัพท์:</strong> {data.applicant_phone || '-'}</p>
                                <p><strong><FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />เงินเดือนที่คาดหวัง:</strong> {typeof data.expected_salary === 'number' ? `${data.expected_salary.toLocaleString()} บาท` : '-'}</p>
                                <p><strong><FontAwesomeIcon icon={faCalendarAlt} className="me-2" />วันที่พร้อมเริ่มงาน:</strong> {formatDateTime(data.available_start_date)}</p>
                                <p><strong><FontAwesomeIcon icon={faLink} className="me-2" />ลิงก์อื่นๆ:</strong> {data.other_links_text || '-'}</p>
                                <p>
                                    <strong><FontAwesomeIcon icon={faFileAlt} className="me-2" />เรซูเม่:</strong>
                                    {resumeHref ? <a href={resumeHref} target="_blank" rel="noreferrer" className="ms-2">เปิดไฟล์</a> : ' -'}
                                </p>
                            </Col>
                            <Col md={6}>
                                <h5 className="fw-bold mb-3">
                                    <FontAwesomeIcon icon={faBriefcase} className="me-2 text-primary" />
                                    ข้อมูลประกาศงาน
                                </h5>
                                <p><strong>ตำแหน่งที่สมัคร:</strong> {data.job_title || `#${data.job_posting_id}`}</p>
                                <h5 className="fw-bold mb-3 mt-4">สถานะใบสมัคร</h5>
                                {typeof data.application_status === 'undefined' ? (
                                    <p className="text-muted">N/A (ตารางไม่มีคอลัมน์ <code>application_status</code>)</p>
                                ) : (
                                    <>
                                        <Form.Select
                                            value={data.application_status || 'pending'}
                                            onChange={(e) => changeStatus(e.target.value)}
                                            disabled={isUpdating || isFinalized}
                                            className="w-auto"
                                            title={isFinalized ? 'ใบสมัครนี้ถูกปิดการดำเนินการแล้ว' : undefined}
                                            style={customSelectStyle(data.application_status)}
                                        >
                                            <option value="pending" style={{ backgroundColor: '#fff', color: '#000' }}>รอดำเนินการ</option>
                                            <option value="reviewed" style={{ backgroundColor: '#fff', color: '#000' }}>พิจารณาแล้ว</option>
                                            <option value="rejected" style={{ backgroundColor: '#fff', color: '#000' }}>ปฏิเสธ</option>
                                            <option value="hired" style={{ backgroundColor: '#fff', color: '#000' }}>จ้างงานแล้ว</option>
                                        </Form.Select>
                                        {isUpdating && <Spinner animation="border" size="sm" className="ms-2" />}
                                    </>
                                )}
                            </Col>
                        </Row>
                    </div>

                    {/* Schedule Interview Section */}
                    <div className="p-3 mb-4 border rounded">
                        <h5 className="fw-bold mb-3">
                            <FontAwesomeIcon icon={faCalendarAlt} className="me-2 text-primary" />
                            นัดสัมภาษณ์
                        </h5>
                        <Form onSubmit={scheduleInterview} className="mb-3">
                            <Row className="g-3">
                                <Col md={4}>
                                    <Form.Label>วันเวลา</Form.Label>
                                    <Form.Control
                                        type="datetime-local"
                                        value={ivForm.scheduled_at}
                                        onChange={(e) => setIvForm({ ...ivForm, scheduled_at: e.target.value })}
                                        required
                                        disabled={isFinalized || ivLoading}
                                    />
                                    <div className="form-text">เวลาที่กรอกเป็นเวลาไทย</div>
                                </Col>
                                <Col md={3}>
                                    <Form.Label>รูปแบบ</Form.Label>
                                    <Form.Select
                                        value={ivForm.method}
                                        onChange={(e) => setIvForm({ ...ivForm, method: e.target.value })}
                                        disabled={isFinalized || ivLoading}
                                    >
                                        <option value="online">ออนไลน์</option>
                                        <option value="onsite">ที่ออฟฟิศ</option>
                                        <option value="phone">โทรศัพท์</option>
                                    </Form.Select>
                                </Col>
                                <Col md={5}>
                                    <Form.Label>สถานที่/ลิงก์</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Google Meet/Zoom link หรือที่อยู่"
                                        value={ivForm.location_or_link}
                                        onChange={(e) => setIvForm({ ...ivForm, location_or_link: e.target.value })}
                                        disabled={isFinalized || ivLoading}
                                    />
                                </Col>
                                <Col md={12}>
                                    <Form.Label>หมายเหตุถึงผู้สมัคร (optional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={ivForm.notes}
                                        onChange={(e) => setIvForm({ ...ivForm, notes: e.target.value })}
                                        disabled={isFinalized || ivLoading}
                                    />
                                </Col>
                            </Row>
                            <div className="mt-3">
                                <Button type="submit" disabled={isFinalized || ivLoading}>
                                    <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                    ส่งอีเมลนัดสัมภาษณ์
                                    {ivLoading && <Spinner animation="border" size="sm" className="ms-2" />}
                                </Button>
                            </div>
                        </Form>

                        <div className="table-responsive">
                            <Table bordered hover>
                                <thead className="table-light">
                                    <tr>
                                        <th>วันเวลา</th>
                                        <th>รูปแบบ</th>
                                        <th>สถานที่/ลิงก์</th>
                                        <th>หมายเหตุ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interviews.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center text-muted">
                                                ยังไม่มีการนัดสัมภาษณ์
                                            </td>
                                        </tr>
                                    ) : (
                                        interviews.map((iv) => (
                                            <tr key={iv.interview_id}>
                                                <td>{formatDateTime(iv.scheduled_at)}</td>
                                                <td>{iv.method}</td>
                                                <td>{iv.location_or_link || '-'}</td>
                                                <td>{iv.notes || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </div>

                    {/* Decision Section */}
                    <div className="p-3 mb-5 border rounded">
                        <h5 className="fw-bold mb-3">
                            <FontAwesomeIcon icon={faPaperPlane} className="me-2 text-primary" />
                            ส่งผลพิจารณา
                        </h5>
                        <Row className="g-3">
                            <Col md={3}>
                                <Form.Select
                                    value={decision}
                                    onChange={(e) => setDecision(e.target.value)}
                                    disabled={isFinalized || sendingDecision}
                                    style={customSelectStyle(decision)}
                                >
                                    <option value="hired" style={{ backgroundColor: '#fff', color: '#000' }}>ผ่าน (hired)</option>
                                    <option value="rejected" style={{ backgroundColor: '#fff', color: '#000' }}>ไม่ผ่าน (rejected)</option>
                                </Form.Select>
                            </Col>
                            <Col md={9}>
                                <Form.Control
                                    type="text"
                                    placeholder="หมายเหตุ (optional) – จะพิมพ์แนบในอีเมลถึงผู้สมัคร"
                                    value={decisionNote}
                                    onChange={(e) => setDecisionNote(e.target.value)}
                                    disabled={isFinalized || sendingDecision}
                                />
                            </Col>
                        </Row>
                        <div className="mt-3 d-flex gap-2">
                            <Button onClick={sendDecision} disabled={isFinalized || sendingDecision}>
                                <FontAwesomeIcon icon={faPaperPlane} className="me-2" />
                                ส่งอีเมลผลการพิจารณา
                                {sendingDecision && <Spinner animation="border" size="sm" className="ms-2" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HrApplicantDetailPage;