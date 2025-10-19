// หน้าดูรายละเอียดประกาศงานสำหรับ HR/Admin (ดีไซน์ตามคำขอและแก้ไขข้อผิดพลาด)

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Spinner, Alert, Card, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBuilding, faDollarSign, faLocationDot, faCalendarDays, faClock, faClipboardList, faEdit,
    faExclamationTriangle, faArrowLeft, faCircleUser
} from '@fortawesome/free-solid-svg-icons';

function JobPostingDetailPage() {
    const { id } = useParams();              // ดึงพารามิเตอร์ id จาก URL (รหัสประกาศงาน)
    const navigate = useNavigate();          // ใช้สำหรับสั่งเปลี่ยนหน้า/ย้อนกลับ

    // เก็บสถานะข้อมูล/โหลด/เออเรอร์
    const [jobPosting, setJobPosting] = useState(null); // เก็บข้อมูลประกาศงานที่ดึงจาก API
    const [loading, setLoading] = useState(true);       // true ตอนกำลังโหลดข้อมูล
    const [error, setError] = useState(null);           // เก็บข้อความผิดพลาด (ถ้ามี)

    useEffect(() => {
        // ฟังก์ชันเรียก API เพื่อดึงรายละเอียดประกาศงานตาม id
        const fetchJobPosting = async () => {
            setLoading(true); // เริ่มโหลด
            try {
                const res = await api.get(`/job-postings/${id}`); // เรียก API ด้วย id จาก URL
                setJobPosting(res.data);                          // เซ็ตข้อมูลที่ได้เข้า state
            } catch (err) {
                // ถ้าพลาด เซ็ตข้อความแจ้งเตือน และ log เพื่อ debug
                setError('ไม่พบประกาศรับสมัครงานนี้ หรือเกิดข้อผิดพลาดในการโหลดข้อมูล');
                console.error("Failed to fetch job posting for Admin:", err);
            }
            setLoading(false); 
        };
        fetchJobPosting();
    }, [id]); // รันใหม่เมื่อ id เปลี่ยน

    // helper: แปลงวันที่เป็นรูปแบบไทยสั้น ๆ
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // แสดงสถานะต่าง ๆ ตามลำดับ: กำลังโหลด → error → ไม่พบ → แสดงผล
    if (loading) return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;
    if (!jobPosting) return null; // กัน null ซ้ำ

    // แตกบรรทัดข้อความให้กลายเป็น list (แยกด้วย \n) และกรองบรรทัดว่างออก
    const qualifications = jobPosting.qualifications_text
        ? jobPosting.qualifications_text.split('\n').filter(Boolean)
        : [];
    const benefits = jobPosting.benefits_text
        ? jobPosting.benefits_text.split('\n').filter(Boolean)
        : [];

    return (
        <div>
            {/* หัวข้อหน้า */}
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดประกาศงาน</h4>

            {/* แถวปุ่มควบคุม: ย้อนกลับ + แก้ไข */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                {/* ปุ่มย้อนกลับไปหน้าก่อนหน้า */}
                <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
                </Button>

                {/* ปุ่มไปหน้าแก้ไขประกาศ (ส่ง id ไปหน้าฟอร์มแก้ไข) */}
                <Button variant="primary" onClick={() => navigate(`/job-postings/edit/${jobPosting.job_posting_id}`)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faEdit} className="me-2" /> แก้ไขประกาศ
                </Button>
            </div>

            {/* การ์ดหลักครอบรายละเอียดทั้งหมด */}
            <div className="card job-detail-card shadow-sm mt-4">
                <div className="card-body p-5" style={{ backgroundColor: '#fff' }}>
                    <div className="job-detail-content">
                        {/* ส่วนหัวรายละเอียดงาน (ชื่อ ตำแหน่ง บริษัท ที่ตั้ง เงินเดือน ช่วงวัน) */}
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                {/* ชื่อประกาศงาน */}
                                <h3 className="fw-bold">{jobPosting.job_title}</h3>
                                {/* ชื่อบริษัท (ถ้าไม่มี แสดง '-') */}
                                <p className="text-muted fs-5 mb-1">{jobPosting.company_name || '-'}</p>
                                {/* ที่ตั้งงาน/รูปแบบทำงาน */}
                                <p className="text-muted mb-1">{jobPosting.job_location_text || '-'}</p>
                                {/* ช่วงเงินเดือน แสดงเป็น 1,000 - 2,000 บาท ถ้าเป็นตัวเลข */}
                                <p className="fs-5">
                                    {jobPosting.salary_min?.toLocaleString()} - {jobPosting.salary_max?.toLocaleString()} บาท
                                </p>
                            </div>
                            <div className="text-muted">
                                {/* วันที่ประกาศ/หมดเขตสมัคร (format แบบไทย) */}
                                <small>ประกาศเมื่อ: {formatDate(jobPosting.posted_at)}</small><br/>
                                <small>หมดเขต: {jobPosting.application_deadline ? formatDate(jobPosting.application_deadline) : '-'}</small>
                            </div>
                        </div>

                        <hr className="my-4" />

                        {/* รายละเอียดงาน (รองรับขึ้นบรรทัดใหม่ด้วย whiteSpace: pre-wrap) */}
                        <div className="job-detail-section mb-4">
                            <h5>รายละเอียดงาน</h5>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{jobPosting.job_description || '-'}</p>
                        </div>

                        <hr className="my-4" />

                        {/* คุณสมบัติผู้สมัคร: แสดงเป็น bullet ถ้ามีข้อมูล */}
                        <div className="job-detail-section mb-4">
                            <h5>คุณสมบัติผู้สมัคร</h5>
                            {qualifications.length > 0 ? (
                                <ul className="list-unstyled ps-4">
                                    {qualifications.map((q, i) => <li key={i}>{q}</li>)}
                                </ul>
                            ) : <p>-</p>}
                        </div>

                        <hr className="my-4" />

                        {/* สวัสดิการ: แสดงเป็นลำดับเลข ถ้ามีข้อมูล */}
                        <div className="job-detail-section mb-4">
                            <h5>สวัสดิการ</h5>
                            {benefits.length > 0 ? (
                                <ol className="ps-4">
                                    {benefits.map((b, i) => <li key={i}>{b}</li>)}
                                </ol>
                            ) : <p>-</p>}
                        </div>

                        <hr className="my-4" />

                        {/* ช่องทางติดต่อ */}
                        <div className="job-detail-section mb-5">
                            <h5>ติดต่อ</h5>
                            <p className="mb-1"><span className="fw-bold">ผู้ติดต่อ :</span> {jobPosting.contact_person_name || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">ที่อยู่ :</span> {jobPosting.contact_address_text || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">โทรศัพท์ :</span> {jobPosting.contact_phone || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">อีเมล :</span> {jobPosting.contact_email || '-'}</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default JobPostingDetailPage;
