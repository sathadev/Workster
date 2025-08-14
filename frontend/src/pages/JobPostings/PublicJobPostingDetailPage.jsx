
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // <--- แก้ไขบรรทัดนี้import { useParams } from "react-router-dom";
import { publicApi } from "../../api/axios";
import { Spinner, Alert } from "react-bootstrap";
import "./PublicJobPostingDetailPage.css";

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
      }
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "2-digit",
      month: "short",
      day: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" /> กำลังโหลด...
      </div>
    );
  if (error)
    return (
      <Alert variant="danger" className="mt-5 text-center">
        {error}
      </Alert>
    );
  if (!job) return null;

  // แยกคุณสมบัติ/สวัสดิการเป็น list ถ้าเป็น string
  const qualifications = job.qualifications_text
    ? job.qualifications_text.split("\n").filter(Boolean)
    : [];
  const benefits = job.benefits_text
    ? job.benefits_text.split("\n").filter(Boolean)
    : [];

  return (
    <div
      style={{
        fontFamily: '"Noto Sans Thai", sans-serif',
        background: "#f8f9fa",
        minHeight: "100vh",
      }}
    >
      {/* Navbar */}
      <nav
        className="navbar navbar-dark"
        style={{ backgroundColor: "#1E56A0", padding: 10 }}
      >
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 fs-4">WorkSter</span>
          <span className="text-white fs-3">
            <i
              className="fa-solid fa-circle-user"
              style={{ color: "#fff" }}
            ></i>
          </span>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          {/* Sidebar */}
          <div className="col-md-2 sidebar"></div>
          {/* Main Content */}
          <div className="col-md-10 p-4" style={{ backgroundColor: "#fff" }}>
            <h4 className="mb-4">ประกาศรับสมัครงาน</h4>
            <div className="card job-detail-card">
              <div className="card-body p-5">
                <div className="job-detail-content">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h3 className="fw-bold">{job.job_title}</h3>
                      <p className="text-muted fs-5 mb-1">{job.company_name}</p>
                      <p className="text-muted mb-1">
                        {job.job_location_text || "-"}
                      </p>
                      <p className="fs-5">
                        {job.salary_min?.toLocaleString()} -{" "}
                        {job.salary_max?.toLocaleString()} บาท
                      </p>
                    </div>
                    <div className="text-muted">
                      <small>{formatDate(job.posted_at)}</small>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="job-detail-section mb-4">
                    <h5>รายละเอียดงาน</h5>
                    <p>{job.job_description || "-"}</p>
                  </div>
                  <hr className="my-4" />

                  <div className="job-detail-section mb-4">
                    <h5>คุณสมบัติผู้สมัคร</h5>
                    {qualifications.length > 0 ? (
                      <ol className="ps-4">
                        {qualifications.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ol>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <hr className="my-4" />

                  <div className="job-detail-section mb-4">
                    <h5>สวัสดิการ</h5>
                    {benefits.length > 0 ? (
                      <ol className="ps-4">
                        {benefits.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ol>
                    ) : (
                      <p>-</p>
                    )}
                  </div>
                  <hr className="my-4" />

                  <div className="job-detail-section mb-5">
                    <h5>ติดต่อ</h5>
                    <p className="mb-1">{job.contact_person_name || "-"}</p>
                    <p className="mb-1">{job.contact_address_text || "-"}</p>
                    <p className="mb-1">
                      <span className="fw-bold">โทรศัพท์ :</span>{" "}
                      {job.contact_phone || "-"}
                    </p>
                    <p className="mb-1">
                      <span className="fw-bold">อีเมล :</span>{" "}
                      {job.contact_email || "-"}
                    </p>
                  </div>

                  <div className="text-end">
                    <Link
                      to={`/public/job-applications/${job.job_posting_id}`}
                      className={`btn btn-primary px-4 ${
                        job.job_status !== "active" ? "disabled" : ""
                      }`}
                    >
                      {job.job_status === "active" ? "สมัครงาน" : "ปิดรับสมัคร"}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicJobPostingDetailPage;
