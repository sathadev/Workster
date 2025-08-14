// frontend/src/pages/hr/HrApplicantDetailPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Alert, Form, Table } from 'react-bootstrap';
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
} from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

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

  const fetchDetail = async () => {
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
  };

  const fetchInterviews = async () => {
    setIvLoading(true);
    try {
      const res = await api.get(`/hr/applicants/${applicationId}/interviews`);
      setInterviews(res.data.items || []);
    } catch (err) {
      console.error('Error fetching interviews:', err);
    } finally {
      setIvLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchInterviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

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
    try { localStorage.setItem('employee_prefill', JSON.stringify(prefill)); } catch {}
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

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /> กำลังโหลด...</div>;
  if (error) return <Alert variant="danger" className="mt-5 text-center">{error}</Alert>;
  if (!data) return <div className="text-center mt-5">ไม่พบข้อมูลผู้สมัคร</div>;

  const resumeHref = data.resume_filepath
    ? (data.resume_filepath.startsWith('/uploads')
        ? `${API_BASE}${data.resume_filepath}`
        : `${API_BASE}/uploads/resumes/${data.resume_filepath}`)
    : null;

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold mb-0">รายละเอียดผู้สมัคร</h4>
        <div className="d-flex gap-2">
          {/* ปุ่มเพิ่มเป็นพนักงาน — ใช้ได้เมื่อผ่าน (hired) */}
          <Button
            variant="success"
            onClick={goAddEmployee}
            disabled={!isHired}
            title={isHired ? '' : 'ปุ่มนี้จะกดได้เมื่อผลเป็น “ผ่าน (hired)”'}
          >
            เพิ่มเป็นพนักงาน
          </Button>
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> กลับ
          </Button>
        </div>
      </div>

      <p className="text-muted mb-3">
        <Link to="/hr/applicants">รายการใบสมัคร</Link> / รายละเอียดผู้สมัคร
      </p>

      {isFinalized && (
        <Alert variant="secondary" className="mb-3">
          ใบสมัครนี้ถูก<span className="fw-bold">ปิดการดำเนินการ</span>แล้ว — ไม่สามารถนัดสัมภาษณ์หรือส่งผลพิจารณาได้อีก
        </Alert>
      )}

      <Card className="shadow-sm p-4 mb-4">
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
                >
                  <option value="pending">รอดำเนินการ</option>
                  <option value="reviewed">พิจารณาแล้ว</option>
                  <option value="rejected">ปฏิเสธ</option>
                  <option value="hired">จ้างงานแล้ว</option>
                </Form.Select>
                {isUpdating && <Spinner animation="border" size="sm" className="ms-2" />}
              </>
            )}
          </Col>
        </Row>
      </Card>

      {/* นัดสัมภาษณ์ */}
      <Card className="shadow-sm p-4 mb-4">
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
      </Card>

      {/* ส่งผลพิจารณา */}
      <Card className="shadow-sm p-4 mb-5">
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
            >
              <option value="hired">ผ่าน (hired)</option>
              <option value="rejected">ไม่ผ่าน (rejected)</option>
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

          {/* ปุ่มเพิ่มเป็นพนักงาน (สำรองอีกจุดหนึ่ง) */}
          <Button
            variant="success"
            onClick={goAddEmployee}
            disabled={!isHired}
            title={isHired ? '' : 'ปุ่มนี้จะกดได้เมื่อผลเป็น “ผ่าน (hired)”'}
          >
            เพิ่มเป็นพนักงาน
          </Button>
        </div>
      </Card>
    </Container>
  );
}

export default HrApplicantDetailPage;
