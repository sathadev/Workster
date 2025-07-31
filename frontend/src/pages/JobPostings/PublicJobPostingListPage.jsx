// frontend/src/pages/JobPostings/PublicJobPostingListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { publicApi } from '../../api/axios'; // <-- Import publicApi เข้ามา
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faTimes, faInbox, faInfoCircle,
    faSortUp, faSortDown, faBuilding, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons'; // <-- แก้ไข path ตรงนี้
import { Form, Button, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';

function PublicJobPostingListPage() {
    const [jobPostings, setJobPostings] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        jobpos_id: '' // กรองตามตำแหน่งที่ประกาศ
    });
    const [sortConfig, setSortConfig] = useState({ key: 'posted_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [positions, setPositions] = useState([]); // สำหรับ dropdown ตำแหน่งงาน

    // Fetch Job Positions for filter dropdown (ใช้ publicApi)
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                // เรียก Public API Endpoint สำหรับ Job Positions
                const response = await publicApi.get('/positions/public'); // <-- แก้ไขตรงนี้: ใช้ publicApi และเรียก /positions/public
                setPositions(response.data); // Backend จะกรองเฉพาะ Global positions มาให้แล้ว
            } catch (err) {
                console.error("Failed to fetch positions for public job postings:", err);
            }
        };
        fetchPositions();
    }, []);

    // Fetch Public Job Postings (ใช้ publicApi)
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
            // เรียก Public API Endpoint
            const response = await publicApi.get('/job-postings/public', { params }); // <-- แก้ไขตรงนี้: ใช้ publicApi
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

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;

    return (
        <div className="container py-4">
            <h4 className="mb-4">ประกาศรับสมัครงานทั้งหมด</h4>

            {/* Filter Section */}
            <div className="row g-2 mb-3">
                <div className="col-md-6">
                    <form onSubmit={handleSearchSubmit} className="search-form">
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ค้นหาชื่อตำแหน่ง หรือบริษัท..."
                                value={searchInput}
                                onChange={handleSearchInputChange}
                            />
                            <button className="btn btn-outline-secondary" type="submit">
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                            {filters.search && (
                                <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา">
                                    <FontAwesomeIcon icon={faTimes} className="me-1" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <div className="col-md-4">
                    <div className="input-group">
                        <label className="input-group-text">ตำแหน่ง</label>
                        <Form.Select name="jobpos_id" value={filters.jobpos_id} onChange={handleFilterChange}>
                            <option value="">ทุกตำแหน่ง</option>
                            {positions.map(pos => (
                                <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                            ))}
                        </Form.Select>
                    </div>
                </div>
            </div>

            {filters.search && !error && (
                <div className="alert alert-info py-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                </div>
            )}

            {/* Job Postings Grid/List */}
            <Row xs={1} md={2} lg={3} className="g-4">
                {jobPostings.length > 0 ? jobPostings.map(post => (
                    <Col key={post.job_posting_id}>
                        <Card className="h-100 shadow-sm">
                            <Card.Body>
                                <Card.Title className="fw-bold text-primary">{post.job_title}</Card.Title>
                                <Card.Subtitle className="mb-2 text-muted">
                                    <FontAwesomeIcon icon={faBuilding} className="me-1" /> {post.company_name}
                                </Card.Subtitle>
                                <Card.Text>
                                    <strong>ตำแหน่งในระบบ:</strong> {post.jobpos_name || '-'} <br />
                                    <strong>สถานที่:</strong> {post.job_location_text || '-'} <br />
                                    <strong>เงินเดือน:</strong> {post.salary_min?.toLocaleString()} - {post.salary_max?.toLocaleString()} บาท <br />
                                    <strong>หมดเขต:</strong> {post.application_deadline ? formatDate(post.application_deadline) : '-'}
                                </Card.Text>
                                <Link to={`/public/job-postings/${post.job_posting_id}`} className="btn btn-outline-primary btn-sm">
                                    ดูรายละเอียด
                                </Link>
                            </Card.Body>
                            <Card.Footer className="text-muted text-end">
                                <small>ประกาศเมื่อ: {formatDate(post.posted_at)}</small>
                            </Card.Footer>
                        </Card>
                    </Col>
                )) : (
                    <Col xs={12}>
                        <div className="text-center text-muted p-4">
                            <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                            <h4>ไม่พบประกาศรับสมัครงาน</h4>
                            <p>{filters.search || filters.jobpos_id ? 'ไม่พบประกาศตามเงื่อนไขที่เลือก' : 'ยังไม่มีประกาศรับสมัครงานที่เปิดรับ'}</p>
                        </div>
                    </Col>
                )}
            </Row>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-muted">หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)</span>
                    <div className="btn-group">
                        <Button variant="outline-secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                            ก่อนหน้า
                        </Button>
                        <Button variant="outline-secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={!meta.totalPages || currentPage >= meta.totalPages}>
                            ถัดไป
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PublicJobPostingListPage;
