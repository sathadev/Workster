import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUser, faBriefcase, faMoneyBillWave, faCalendarAlt, faLink, faFileAlt, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import api from '../../api/axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function HrApplicantDetailPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      // ✅ ใช้เส้นทางของ HR
      const res = await api.get(`/hr/applicants/${applicationId}`);
      setData(res.data || null);
    } catch (err) {
      console.error('Error fetching applicant detail:', err);
      setError(err?.response?.data?.message || 'ไม่สามารถโหลดข้อมูลผู้สมัครได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [applicationId]);

  const changeStatus = async (newStatus) => {
    setIsUpdating(true);
    try {
      // ✅ ใช้เส้นทางของ HR
      await api.patch(`/hr/applicants/${applicationId}/status`, { status: newStatus });
      setData(prev => ({ ...prev, application_status: newStatus }));
      alert('อัปเดตสถานะสำเร็จ!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert(err?.response?.data?.message || 'อัปเดตสถานะไม่สำเร็จ');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /> กำลังโหลด...</div>;
  if (error) return <Alert variant="danger" className="mt-5 text-center">{error}</Alert>;
  if (!data) return <div className="text-center mt-5">ไม่พบข้อมูลผู้สมัคร</div>;

  // ✅ ถ้า DB เก็บ path เริ่มด้วย /uploads ให้ต่อเป็น `${API_BASE}${path}`
  const resumeHref = data.resume_filepath
    ? (data.resume_filepath.startsWith('/uploads')
        ? `${API_BASE}${data.resume_filepath}`
        : `${API_BASE}/uploads/resumes/${data.resume_filepath}`)
    : null;

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">รายละเอียดผู้สมัคร</h4>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> กลับ
        </Button>
      </div>
      <p className="text-muted mb-4">
        <Link to="/hr/applicants">รายการใบสมัคร</Link> / รายละเอียดผู้สมัคร
      </p>

      <Card className="shadow-sm p-4">
        <Row>
          <Col md={6}>
            <h5 className="fw-bold mb-3"><FontAwesomeIcon icon={faUser} className="me-2 text-primary" />ข้อมูลผู้สมัคร</h5>
            <p><strong>ชื่อ-นามสกุล:</strong> {data.applicant_name}</p>
            <p><strong><FontAwesomeIcon icon={faEnvelope} className="me-2" />อีเมล:</strong> {data.applicant_email}</p>
            <p><strong><FontAwesomeIcon icon={faPhone} className="me-2" />โทรศัพท์:</strong> {data.applicant_phone || '-'}</p>
            <p><strong><FontAwesomeIcon icon={faMoneyBillWave} className="me-2" />เงินเดือนที่คาดหวัง:</strong> {typeof data.expected_salary === 'number' ? `${data.expected_salary.toLocaleString()} บาท` : '-'}</p>
            <p><strong><FontAwesomeIcon icon={faCalendarAlt} className="me-2" />วันที่พร้อมเริ่มงาน:</strong> {formatDate(data.available_start_date)}</p>
            <p><strong><FontAwesomeIcon icon={faLink} className="me-2" />ลิงก์อื่นๆ:</strong> {data.other_links_text || '-'}</p>
            <p><strong><FontAwesomeIcon icon={faFileAlt} className="me-2" />เรซูเม่:</strong>
              {resumeHref ? <a href={resumeHref} target="_blank" rel="noreferrer" className="ms-2">เปิดไฟล์</a> : ' -'}
            </p>
          </Col>
          <Col md={6}>
            <h5 className="fw-bold mb-3"><FontAwesomeIcon icon={faBriefcase} className="me-2 text-primary" />ข้อมูลประกาศงาน</h5>
            <p><strong>ตำแหน่งที่สมัคร:</strong> {data.job_title || `#${data.job_posting_id}`}</p>

            <h5 className="fw-bold mb-3 mt-4">สถานะใบสมัคร</h5>
            {typeof data.application_status === 'undefined' ? (
              <p className="text-muted">N/A (ตารางไม่มีคอลัมน์ <code>application_status</code>)</p>
            ) : (
              <>
                <Form.Select
                  value={data.application_status || 'pending'}
                  onChange={e => changeStatus(e.target.value)}
                  disabled={isUpdating}
                  className="w-auto"
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
    </Container>
  );
}

export default HrApplicantDetailPage;
