// frontend/src/pages/JobPostings/JobPostingDetailPage.jsx
// หน้าดูรายละเอียดประกาศงานสำหรับ HR/Admin (ดีไซน์ตามคำขอและแก้ไขข้อผิดพลาด)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // เพิ่ม Link, useNavigate
import api from '../../api/axios'; // ใช้ api สำหรับ HR/Admin view
import { Spinner, Alert, Card, Button } from 'react-bootstrap'; // เพิ่ม Card, Button
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding, faDollarSign, faLocationDot, faCalendarDays, faClock, faClipboardList, faEdit, // ไอคอนหลัก
    faExclamationTriangle, faArrowLeft, faCircleUser // สำหรับ Error, ปุ่มย้อนกลับ, และไอคอนผู้ใช้ใน Navbar
} from '@fortawesome/free-solid-svg-icons';

function JobPostingDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [jobPosting, setJobPosting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobPosting = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/job-postings/${id}`); // ใช้ api สำหรับ HR/Admin
                setJobPosting(res.data);
            } catch (err) {
                setError('ไม่พบประกาศรับสมัครงานนี้ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล');
                console.error("Failed to fetch job posting for Admin:", err);
            }
            setLoading(false);
        };
        fetchJobPosting();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    if (loading) return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;
    if (!jobPosting) return null;

    const qualifications = jobPosting.qualifications_text
        ? jobPosting.qualifications_text.split('\n').filter(Boolean)
        : [];
    const benefits = jobPosting.benefits_text
        ? jobPosting.benefits_text.split('\n').filter(Boolean)
        : [];

    return (
        // <<<<<<< ส่วนโครงสร้างหลัก: เอา Navbar/Sidebar และ container-fluid ที่ซ้ำซ้อนออก >>>>>>>
        // เหลือแค่เนื้อหาหลักของเพจ ที่ควรจะ Render ภายใน MainLayout
        <div>
            {/* Page Header (ตามสไตล์ของหน้า Admin อื่นๆ) */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดประกาศงาน</h4>
                {/* <<<<<<< เพิ่มปุ่ม "แก้ไขประกาศ" สำหรับ HR/Admin >>>>>>> */}
                <Button variant="primary" onClick={() => navigate(`/job-postings/edit/${jobPosting.job_posting_id}`)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faEdit} className="me-2" /> แก้ไขประกาศ
                </Button>
            </div>
            {/* Breadcrumb (ตามสไตล์ของหน้า Admin อื่นๆ) */}
            <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>
                <Link to="/job-postings" className="text-secondary text-decoration-none link-primary-hover">จัดการประกาศรับสมัครงาน</Link> / <span className="text-dark">รายละเอียด</span>
            </p>

            {/* Main Content Card (ตาม HTML ที่ให้มา) */}
            {/* <<<<<<< ปรับ Card เพื่อให้ใช้ padding และ background ที่เหมาะสม >>>>>>> */}
            <Card className="card job-detail-card shadow-sm mt-4"> {/* ใช้ Card จาก react-bootstrap */}
                <Card.Body className="p-5" style={{ backgroundColor: '#fff' }}> {/* p-5 และพื้นหลังขาว */}

                    <div className="job-detail-content">

                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h3 className="fw-bold">{jobPosting.job_title}</h3>
                                <p className="text-muted fs-5 mb-1">{jobPosting.company_name || '-'}</p>
                                <p className="text-muted mb-1">{jobPosting.job_location_text || '-'}</p>
                                <p className="fs-5">
                                    {jobPosting.salary_min?.toLocaleString()} - {jobPosting.salary_max?.toLocaleString()} บาท
                                </p>
                            </div>
                            <div className="text-muted">
                                <small>ประกาศเมื่อ: {formatDate(jobPosting.posted_at)}</small><br/>
                                <small>หมดเขต: {jobPosting.application_deadline ? formatDate(jobPosting.application_deadline) : '-'}</small>
                            </div>
                        </div>

                        <hr className="my-4" />

                        <div className="job-detail-section mb-4">
                            <h5>รายละเอียดงาน</h5>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{jobPosting.job_description || '-'}</p>
                        </div>
                        <hr className="my-4" />

                        <div className="job-detail-section mb-4">
                            <h5>คุณสมบัติผู้สมัคร</h5>
                            {qualifications.length > 0 ? (
                                <ul className="list-unstyled ps-4">
                                    {qualifications.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            ) : <p>-</p>}
                        </div>
                        <hr className="my-4" />

                        <div className="job-detail-section mb-4">
                            <h5>สวัสดิการ</h5>
                            {benefits.length > 0 ? (
                                <ol className="ps-4">
                                    {benefits.map((b, i) => <li key={i}>{b}</li>)}
                                </ol>
                            ) : <p>-</p>}
                        </div>
                        <hr className="my-4" />

                        <div className="job-detail-section mb-5">
                            <h5>ติดต่อ</h5>
                            <p className="mb-1"><span className="fw-bold">ผู้ติดต่อ :</span> {jobPosting.contact_person_name || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">ที่อยู่ :</span> {jobPosting.contact_address_text || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">โทรศัพท์ :</span> {jobPosting.contact_phone || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">อีเมล :</span> {jobPosting.contact_email || '-'}</p>
                        </div>

                        <div className="text-end">
                            {/* ปุ่ม "กลับ" */}
                            <Button 
                                variant="secondary" 
                                className="px-4" 
                                onClick={() => navigate('/job-postings')} 
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> กลับหน้ารายการ
                            </Button>
                        </div>

                    </div> {/* end job-detail-content */}
                </Card.Body> {/* end card-body */}
            </Card> {/* end card */}
        </div>
        // <<<<<<< สิ้นสุดส่วนโครงสร้างหลัก >>>>>>>
    );
}

export default JobPostingDetailPage;