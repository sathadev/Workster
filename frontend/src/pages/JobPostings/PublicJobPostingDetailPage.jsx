// frontend/src/pages/JobPostings/PublicJobPostingDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';
import { publicApi } from "../../api/axios";
import { Spinner, Alert, Card, Row, Col, Container, Navbar, Button } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faMapMarkerAlt, faMoneyBillWave, faTags, faListCheck, faAddressCard, faPhone, faEnvelope, faCheckCircle, faUser } from '@fortawesome/free-solid-svg-icons';
import "./PublicJobPostingDetailPage.css";

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

function PublicJobPostingDetailPage() {
    const { id } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchJob = async () => {
            setLoading(true);
            try {
                const res = await publicApi.get(`/job-postings/public/${id}`);
                setJob(res.data);
            } catch (err) {
                setError("ไม่พบประกาศรับสมัครงานนี้ หรือประกาศไม่พร้อมใช้งาน");
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("th-TH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    if (loading)
        return (
            <div className="text-center my-5">
                <Spinner animation="border" /> กำลังโหลด...
            </div>
        );
    if (error)
        return (
            <Container className="my-5">
                <Alert variant="danger" className="text-center">
                    {error}
                </Alert>
            </Container>
        );
    if (!job) return null;

    const qualifications = job.qualifications_text
        ? job.qualifications_text.split("\n").filter(Boolean)
        : [];
    const benefits = job.benefits_text
        ? job.benefits_text.split("\n").filter(Boolean)
        : [];

    return (
        <div style={{ fontFamily: '"Noto Sans Thai", sans-serif', background: "#f0f2f5", minHeight: "100vh" }}>
            <PublicNavbar />
            
            <Container className="py-5">
                <div className="text-center mb-4">
                    <Link to="/public/job-postings" className="btn btn-outline-secondary">
                        <i className="fa-solid fa-arrow-left me-2"></i> กลับไปหน้าประกาศงาน
                    </Link>
                </div>
                <Card className="job-detail-card shadow-lg border-0">
                    <Card.Body className="p-4 p-md-5">
                        <Row className="g-4">
                            <Col lg={8}>
                                <div className="d-flex align-items-start mb-3">
                                    <div className="job-icon-circle me-3">
                                        <FontAwesomeIcon icon={faBuilding} size="2x" />
                                    </div>
                                    <div>
                                        <h1 className="fw-bold text-primary mb-0">{job.job_title}</h1>
                                        <p className="text-muted fs-5 mb-1">{job.company_name}</p>
                                    </div>
                                </div>
                                <hr className="my-4" />
                                <div className="job-meta-info mb-4">
                                    <Row className="g-3">
                                        <Col md={6}>
                                            <p className="mb-1"><FontAwesomeIcon icon={faMoneyBillWave} className="text-success me-2" /> <strong>เงินเดือน:</strong> {job.salary_min?.toLocaleString()} - {job.salary_max?.toLocaleString()} บาท</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-1"><FontAwesomeIcon icon={faMapMarkerAlt} className="text-danger me-2" /> <strong>สถานที่:</strong> {job.job_location_text || "-"}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-1"><FontAwesomeIcon icon={faTags} className="text-info me-2" /> <strong>ประเภทงาน:</strong> {job.job_type_text || "-"}</p>
                                        </Col>
                                        <Col md={6}>
                                            <p className="mb-1"><FontAwesomeIcon icon={faListCheck} className="text-warning me-2" /> <strong>จำนวนที่รับ:</strong> {job.hiring_count || "-"}</p>
                                        </Col>
                                    </Row>
                                </div>
                                <hr className="my-4" />
                                <div className="job-detail-section mb-4">
                                    <h3 className="fw-bold text-dark">รายละเอียดงาน</h3>
                                    <p className="text-secondary">{job.job_description || "-"}</p>
                                </div>
                                <div className="job-detail-section mb-4">
                                    <h3 className="fw-bold text-dark">คุณสมบัติผู้สมัคร</h3>
                                    {qualifications.length > 0 ? (
                                        <ul className="list-unstyled ps-4 text-secondary">
                                            {qualifications.map((q, i) => (
                                                <li key={i} className="mb-2"><FontAwesomeIcon icon={faCheckCircle} className="text-primary me-2" /> {q}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-secondary">-</p>
                                    )}
                                </div>
                                <div className="job-detail-section mb-4">
                                    <h3 className="fw-bold text-dark">สวัสดิการ</h3>
                                    {benefits.length > 0 ? (
                                        <ul className="list-unstyled ps-4 text-secondary">
                                            {benefits.map((b, i) => (
                                                <li key={i} className="mb-2"><FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" /> {b}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-secondary">-</p>
                                    )}
                                </div>
                            </Col>
                            <Col lg={4}>
                                <Card className="contact-card border-0 shadow-sm p-3">
                                    <Card.Body>
                                        <h4 className="fw-bold mb-3"><FontAwesomeIcon icon={faAddressCard} className="me-2 text-info" /> ข้อมูลติดต่อ</h4>
                                        <p className="mb-1"><FontAwesomeIcon icon={faUser} className="me-2 text-muted" /> **ผู้ติดต่อ:** {job.contact_person_name || "-"}</p>
                                        <p className="mb-1"><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2 text-muted" /> **ที่อยู่:** {job.contact_address_text || "-"}</p>
                                        <p className="mb-1"><FontAwesomeIcon icon={faPhone} className="me-2 text-muted" /> **โทรศัพท์:** {job.contact_phone || "-"}</p>
                                        <p className="mb-1"><FontAwesomeIcon icon={faEnvelope} className="me-2 text-muted" /> **อีเมล:** {job.contact_email || "-"}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Card.Body>
                    <Card.Footer className="bg-light d-flex justify-content-between align-items-center p-4">
                        <small className="text-muted">ประกาศเมื่อ: {formatDate(job.posted_at)}</small>
                        <Link
                            to={`/public/job-applications/${job.job_posting_id}`}
                            className={`btn btn-primary px-4 py-2 fw-bold ${job.job_status !== "active" ? "disabled" : ""}`}
                        >
                            {job.job_status === "active" ? "สมัครงาน" : "ปิดรับสมัคร"}
                        </Link>
                    </Card.Footer>
                </Card>
            </Container>
            <footer className="bg-dark text-white text-center py-3 mt-5">
                <p className="mb-0">&copy; 2025 WorkSter. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default PublicJobPostingDetailPage;