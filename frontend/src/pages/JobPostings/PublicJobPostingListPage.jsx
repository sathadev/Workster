// frontend/src/pages/JobPostings/PublicJobPostingListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { publicApi } from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faTimes, faInbox, faInfoCircle, faSortUp, faSortDown, faBuilding, faExclamationTriangle,
  faMapMarkerAlt, faMoneyBillWave, faFilter
} from '@fortawesome/free-solid-svg-icons';
import { Form, Button, Alert, Card, Row, Col, Spinner, Container, Navbar } from 'react-bootstrap';
import './PublicJobPostingListPage.css';

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

function PublicJobPostingListPage() {
  const [jobPostings, setJobPostings] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    jobpos_id: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'posted_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await publicApi.get('/positions/public');
        setPositions(response.data);
      } catch (err) {
        console.error("Failed to fetch positions for public job postings:", err);
      }
    };
    fetchPositions();
  }, []);

  const fetchJobPostings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        sort: sortConfig.key,
        order: sortConfig.direction,
        page: currentPage,
        limit: 10,
      };
      const response = await publicApi.get('/job-postings/public', { params });
      setJobPostings(response.data.data || []);
      setMeta(response.data.meta || {});
    } catch (err) {
      console.error("Failed to fetch public job postings:", err.response?.data || err.message);
      setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงาน");
    } finally {
      setLoading(false);
    }
  }, [filters, sortConfig, currentPage]);

  useEffect(() => {
    fetchJobPostings();
  }, [fetchJobPostings]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchInputChange = (e) => setSearchInput(e.target.value);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const clearSearch = () => {
    setSearchInput('');
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, search: '' }));
  };

  const handleSort = (key) => {
    setCurrentPage(1);
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div
      style={{
        fontFamily: '"Noto Sans Thai", sans-serif',
        background: '#f0f2f5',
        minHeight: '100vh',
        display: 'flex',          // ✅ make the page a column flex container
        flexDirection: 'column'   // ✅ stack children vertically
      }}
    >
      <PublicNavbar />

      {/* Main Content */}
      <Container className="py-5" style={{ flex: 1 /* ✅ take remaining height to push footer down */ }}>
        <h2 className="fw-bold mb-4 text-center text-dark">ประกาศรับสมัครงานทั้งหมด</h2>
        <Card className="p-4 mb-4 shadow-sm border-0">
          <Form onSubmit={handleSearchSubmit}>
            <Row className="align-items-start g-3">
              {/* Search Field */}
              <Col md={6}>
                <div className="d-flex flex-column">
                  <Form.Label className="fw-bold">ค้นหางาน</Form.Label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="ค้นหาชื่อตำแหน่ง, บริษัท หรือสถานที่"
                      value={searchInput}
                      onChange={handleSearchInputChange}
                    />
                    <Button variant="primary" type="submit">
                      <FontAwesomeIcon icon={faSearch} />
                    </Button>
                  </div>
                </div>
              </Col>
              {/* Filter by Position Dropdown */}
              <Col md={3}>
                <div className="d-flex flex-column">
                  <Form.Label className="fw-bold">กรองตามตำแหน่ง</Form.Label>
                  <Form.Select name="jobpos_id" onChange={handleFilterChange} value={filters.jobpos_id}>
                    <option value="">-- ทุกตำแหน่ง --</option>
                    {positions.map(pos => (
                      <option key={pos.job_position_id} value={pos.job_position_id}>
                        {pos.job_position_name}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              </Col>
              {/* Sort Dropdown */}
              <Col md={3}>
                <div className="d-flex flex-column">
                  <Form.Label className="fw-bold">เรียงลำดับ</Form.Label>
                  <Form.Select onChange={(e) => handleSort(e.target.value)} value={sortConfig.key}>
                    <option value="posted_at">วันที่ประกาศ</option>
                    <option value="salary">เงินเดือน</option>
                  </Form.Select>
                </div>
              </Col>
            </Row>
            <Row>
              <Col>
                {searchInput && (
                  <Button variant="link" onClick={clearSearch} className="p-0 mt-2 text-danger">
                    <FontAwesomeIcon icon={faTimes} /> ล้างการค้นหา
                  </Button>
                )}
              </Col>
            </Row>
          </Form>
        </Card>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" /> กำลังโหลด...
          </div>
        ) : error ? (
          <Alert variant="danger" className="text-center my-5">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}
          </Alert>
        ) : jobPostings.length > 0 ? (
          <div className="job-listings">
            <Row xs={1} md={2} className="g-4">
              {jobPostings.map(post => (
                <Col key={post.job_posting_id}>
                  <Link to={`/public/job-postings/${post.job_posting_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card className="job-card shadow-sm border-0 h-100">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="card-title fw-bold text-primary mb-0">{post.job_title}</h5>
                          <small className="text-muted">{formatDate(post.posted_at)}</small>
                        </div>
                        <p className="card-text text-muted mb-1"><FontAwesomeIcon icon={faBuilding} className="me-2" /> {post.company_name}</p>
                        <p className="card-text text-muted mb-2"><FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" /> {post.job_location_text || '-'}</p>
                        <h6 className="card-text text-success fw-bold">
                          <FontAwesomeIcon icon={faMoneyBillWave} className="me-2" /> {post.salary_min?.toLocaleString()} - {post.salary_max?.toLocaleString()} บาท
                        </h6>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>
        ) : (
          <div className="text-center text-muted p-5">
            <FontAwesomeIcon icon={faInbox} className="fa-4x mb-3" />
            <h4>ไม่พบประกาศรับสมัครงาน</h4>
            <p className="mb-0">{filters.search || filters.jobpos_id ? 'ไม่พบประกาศตามเงื่อนไขที่เลือก' : 'ยังไม่มีประกาศรับสมัครงานที่เปิดรับ'}</p>
          </div>
        )}

        {meta.totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center mt-4">
            <div className="btn-group">
              <Button variant="outline-primary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                ก่อนหน้า
              </Button>
              <span className="btn btn-light text-muted">หน้า {meta.currentPage || 1} / {meta.totalPages || 1}</span>
              <Button variant="outline-primary" onClick={() => handlePageChange(currentPage + 1)} disabled={!meta.totalPages || currentPage >= meta.totalPages}>
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* Footer (ติดล่างเสมอ) */}
      <footer className="bg-dark text-white text-center py-3 mt-5">
        <p className="mb-0">&copy; 2025 WorkSter. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default PublicJobPostingListPage;
