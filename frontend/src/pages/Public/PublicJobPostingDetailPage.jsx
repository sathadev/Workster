// frontend/src/pages/JobPostings/PublicJobPostingDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { publicApi } from "../../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Navbar, Nav } from "react-bootstrap";
import { NavLink } from "react-router-dom";


import {
  faBuilding,
  faDollarSign,
  faLocationDot,
  faCalendarDays,
  faClock,
  faClipboardList, // ไอคอนสำหรับแสดงรายละเอียด
  faExclamationTriangle,
  faArrowLeft,
  faPaperPlane, // สำหรับ Error และปุ่มย้อนกลับ (ถ้ามี)
} from "@fortawesome/free-solid-svg-icons";
import {
  Card,
  Button,
  Alert,
  Spinner,
  Container,
  Row,
  Col,
  ListGroup,
} from "react-bootstrap";

const PublicNavbar = () => {
  return (
    <Navbar
      expand="lg"
      variant="dark"
      className="ws-navbar sticky-top"
      style={{ backgroundColor: "rgb(33, 37, 41)" }}
    >
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
  const [jobPosting, setJobPosting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobPosting = async () => {
      try {
        setLoading(true);
        const response = await publicApi.get(`/job-postings/public/${id}`);
        setJobPosting(response.data);
      } catch (err) {
        console.error("Failed to fetch job posting:", err);
        setError(
          err.response?.data?.message ||
            "ไม่พบประกาศรับสมัครงานนี้ หรือประกาศไม่พร้อมใช้งาน"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchJobPosting();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading)
    return (
      <div className="text-center mt-5 text-muted">
        <Spinner animation="border" /> กำลังโหลดรายละเอียดประกาศงาน...
      </div>
    );
  if (error)
    return (
      <Alert variant="danger" className="mt-5 text-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        {error}
      </Alert>
    );
  if (!jobPosting)
    return (
      <div
        className="alert alert-warning mt-5 text-center"
        style={{ fontSize: "0.95rem" }}
      >
        ไม่พบข้อมูลประกาศนี้
      </div>
    );

  const isApplicationOpen = jobPosting.job_status === "active";
  const qualifications = jobPosting.qualifications_text
    ? jobPosting.qualifications_text.split("\n").filter(Boolean)
    : [];
  const benefits = jobPosting.benefits_text
    ? jobPosting.benefits_text.split("\n").filter(Boolean)
    : [];

  return (
    <div
      style={{
      fontFamily: '"Noto Sans Thai", sans-serif',
      background: "#f0f2f5",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}ห
    >
      <PublicNavbar /> 
      <Container className="py-4" style={{ flex: 1 }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-dark" style={{ fontSize: "1.8rem" }}>
            รายละเอียดประกาศงาน
          </h4>
          <Button
            variant="outline-secondary"
            onClick={() => window.history.back()}
            style={{ fontSize: "0.9rem" }}
          >
            <FontAwesomeIcon icon={faArrowLeft} className="me-1" /> กลับ
          </Button>
        </div>

        <Card className="shadow-lg border-0 mt-4">
          <Card.Body className="p-4 p-md-5">
            <div className="job-detail-content">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h3 className="fw-bold" style={{ fontSize: "2rem" }}>
                    {jobPosting.job_title}
                  </h3>
                  <p className="text-dark fs-5 mb-1">
                    {jobPosting.company_name || "WorkSter"}
                  </p>
                </div>
                <div className="text-muted text-end">
                  <small>ประกาศเมื่อ: {formatDate(jobPosting.posted_at)}</small>
                  <br />
                  <small>
                    หมดเขต:{" "}
                    {jobPosting.application_deadline
                      ? formatDate(jobPosting.application_deadline)
                      : "-"}
                  </small>
                </div>
              </div>

              <hr className="my-4" />

              {jobPosting.job_description && (
                <div className="mb-4">
                  <h5
                    className="fw-bold text-dark mb-3"
                    style={{ fontSize: "1.3rem" }}
                  >
                    รายละเอียดงาน
                  </h5>
                  <p
                    className="text-secondary"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {jobPosting.job_description}
                  </p>
                </div>
              )}
              <hr className="my-4" />

              {qualifications.length > 0 && (
                <div className="mb-4">
                  <h5
                    className="fw-bold text-dark mb-3"
                    style={{ fontSize: "1.3rem" }}
                  >
                    คุณสมบัติผู้สมัคร
                  </h5>
                  <ul className="list-unstyled ps-4">
                    {qualifications.map((q, i) => (
                      <li key={i} className="text-secondary">
                        <FontAwesomeIcon
                          icon={faClipboardList}
                          className="me-2 text-info"
                        />
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {qualifications.length > 0 && <hr className="my-4" />}

              {benefits.length > 0 && (
                <div className="mb-4">
                  <h5
                    className="fw-bold text-dark mb-3"
                    style={{ fontSize: "1.3rem" }}
                  >
                    สวัสดิการ
                  </h5>
                  <ul className="list-unstyled ps-4">
                    {benefits.map((b, i) => (
                      <li key={i} className="text-secondary">
                        <FontAwesomeIcon
                          icon={faClipboardList}
                          className="me-2 text-info"
                        />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {benefits.length > 0 && <hr className="my-4" />}

              {jobPosting.contact_person_name && (
                <div className="mb-4">
                  <h5
                    className="fw-bold text-dark mb-3"
                    style={{ fontSize: "1.3rem" }}
                  >
                    ติดต่อ
                  </h5>
                  <ul className="list-unstyled">
                    <li className="text-secondary">
                      <strong>ผู้ติดต่อ:</strong>{" "}
                      {jobPosting.contact_person_name || "-"}
                    </li>
                    <li className="text-secondary">
                      <strong>โทรศัพท์:</strong>{" "}
                      {jobPosting.contact_phone || "-"}
                    </li>
                    <li className="text-secondary">
                      <strong>อีเมล:</strong> {jobPosting.contact_email || "-"}
                    </li>
                  </ul>
                </div>
              )}
              {jobPosting.contact_person_name && <hr className="my-4" />}

              <div className="d-flex justify-content-between align-items-center mb-4">
                <span
                  className={`badge bg-${
                    isApplicationOpen ? "success" : "secondary"
                  }`}
                  style={{ fontSize: "1rem", padding: "0.5em 0.8em" }}
                >
                  {isApplicationOpen ? "เปิดรับสมัคร" : "ปิดรับสมัคร"}
                </span>
                <Link
                  to={`/public/job-applications/${jobPosting.job_posting_id}`}
                >
                  <Button
                    variant="primary"
                    disabled={!isApplicationOpen}
                    style={{
                      backgroundColor: isApplicationOpen
                        ? "#007bff"
                        : "#6c757d",
                      borderColor: isApplicationOpen ? "#007bff" : "#6c757d",
                      fontWeight: "bold",
                      // ลบ padding ที่ทำให้ปุ่มใหญ่เกินไปออก หรือปรับให้เล็กลง
                      // padding: '1rem 2.5rem',
                      // fontSize: '1.2rem',
                      borderRadius: "50px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="me-2" />{" "}
                    ยื่นสมัครงาน
                  </Button>
                </Link>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Footer (ติดล่างเสมอ) */}
    {/* Footer (ติดล่างเสมอ) */}
    <footer className="bg-dark text-white text-center py-3">
      <p className="mb-0">&copy; 2025 WorkSter. All rights reserved.</p>
    </footer>
    </div>
  );
}

export default PublicJobPostingDetailPage;
