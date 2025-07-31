// frontend/src/pages/JobPostings/JobPostingDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Card, Alert, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

function JobPostingDetailPage() {
    const { id } = useParams(); // job_posting_id
    const [jobPosting, setJobPosting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJobPosting = async () => {
            setLoading(true);
            setError(null);
            try {
                // ดึงข้อมูลจาก Public API Endpoint
                const response = await api.get(`/job-postings/public/${id}`);
                setJobPosting(response.data);
            } catch (err) {
                console.error("Failed to fetch public job posting details:", err.response?.data || err.message);
                setError(err.response?.data?.message || "ไม่พบประกาศรับสมัครงานนี้ หรือประกาศไม่พร้อมใช้งาน");
            } finally {
                setLoading(false);
            }
        };
        fetchJobPosting();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;
    if (!jobPosting) return <Alert variant="warning" className="mt-5 text-center"><FontAwesomeIcon icon={faInfoCircle} className="me-2" />ไม่พบข้อมูลประกาศ</Alert>;

    return (
        <div className="container py-4">
            <h4 className="mb-4">ประกาศรับสมัครงาน</h4>

            <Card className="job-detail-card shadow-sm">
                <Card.Body className="p-5">
                    <div className="job-detail-content">
                        <div className="d-flex justify-content-between align-items-start">
                            <div>
                                <h3 className="fw-bold">{jobPosting.job_title}</h3>
                                <p className="text-muted fs-5 mb-1">บริษัท {jobPosting.company_name}</p>
                                <p className="text-muted mb-1">{jobPosting.job_location_text || '-'}</p>
                                <p className="fs-5">{jobPosting.salary_min?.toLocaleString()} - {jobPosting.salary_max?.toLocaleString()} บาท</p>
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

                        {/* คุณสมบัติผู้สมัคร (ถ้ามีใน DB) - ตอนนี้ยังไม่มี field แยกใน DB */}
                        {/* <div className="job-detail-section mb-4">
                            <h5>คุณสมบัติผู้สมัคร</h5>
                            <ol className="ps-4">
                                <li>ปริญญาตรี หรือสูงกว่าในสาขาวิทยาการคอมพิวเตอร์, สาขาวิศวกรรมคอมพิวเตอร์ หรือสาขาที่เกี่ยวข้อง</li>
                                <li>มีประสบการณ์ด้านการพัฒนาเว็บไซต์อย่างน้อย 1-3 ปี (หรือหากคาดหวังในระดับตำแหน่ง)</li>
                                <li>ประสบการณ์ด้านการเขียนโปรแกรม Software Applications ,Website ,Web Applications ,CG</li>
                            </ol>
                        </div>
                        <hr className="my-4"> */}

                        {/* สวัสดิการ (ถ้ามีใน DB) - ตอนนี้ยังไม่มี field แยกใน DB */}
                        {/* <div class="job-detail-section mb-4">
                            <h5>สวัสดิการ</h5>
                            <ol class="ps-4">
                                <li>ค่าตอบแทน (เงินเดือน/โบนัส/โบนัสพิเศษ)</li>
                                <li>สวัสดิการอื่นนอกเหนือพิเศษ</li>
                                <li>สิทธิประโยชน์ตามข้อกฏหมายแรงงาน</li>
                            </ol>
                        </div>
                        <hr class="my-4"> */}

                        <div className="job-detail-section mb-5">
                            <h5>ติดต่อ</h5>
                            <p className="mb-1">{jobPosting.contact_person_name || '-'}</p>
                            <p className="mb-1">{jobPosting.contact_address_text || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">โทรศัพท์ :</span> {jobPosting.contact_phone || '-'}</p>
                            <p className="mb-1"><span className="fw-bold">อีเมล :</span> {jobPosting.contact_email || '-'}</p>
                        </div>

                        <div className="text-end">
                            {/* ปุ่มสมัครงาน - ยังไม่มีระบบสมัครงานในตอนนี้ */}
                            <button className="btn btn-primary px-4" disabled>ยืนยันสมัครงาน (ยังไม่เปิดรับ)</button>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </div>
    );
}

export default JobPostingDetailPage;
