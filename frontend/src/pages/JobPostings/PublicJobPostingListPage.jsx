// frontend/src/pages/JobPostings/PublicJobPostingListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faTimes, faInbox, faInfoCircle,
    faSortUp, faSortDown, faBuilding, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { Form, Button, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';
import './PublicJobPostingListPage.css';

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
        <div style={{ fontFamily: '"Noto Sans Thai", sans-serif', background: '#f8f9fa', minHeight: '100vh' }}>
            {/* Navbar */}
            <nav className="navbar navbar-dark" style={{ backgroundColor: '#1E56A0', padding: 10 }}>
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1 fs-4">WorkSter</span>
                    <span className="text-white fs-3">
                        <i className="fa-solid fa-circle-user" style={{ color: '#fff' }}></i>
                    </span>
                </div>
            </nav>

            <div className="container-fluid">
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-md-2 sidebar"></div>

                    {/* Main Content */}
                    <div className="col-md-10 p-4" style={{ backgroundColor: '#fff' }}>
                        <h4 className="mb-4">ประกาศรับสมัครงาน</h4>
                        <div className="d-flex align-items-center mb-4">
                            <span className="me-3 fs-5">ตำแหน่งงานทั้งหมด</span>
                            <div className="input-group search-input" style={{ maxWidth: 350 }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="ค้นหาตำแหน่งงาน"
                                    value={searchInput}
                                    onChange={handleSearchInputChange}
                                />
                                <span className="input-group-text">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                </span>
                            </div>
                        </div>

                        <div className="job-listings">
                            {jobPostings.length > 0 ? jobPostings.map(post => (
                                <Link
                                    to={`/public/job-postings/${post.job_posting_id}`}
                                    key={post.job_posting_id}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    <div className="card job-card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between">
                                                <div>
                                                    <h5 className="card-title fw-bold">{post.job_title}</h5>
                                                    <p className="card-text text-muted mb-1">{post.company_name}</p>
                                                    <p className="card-text text-muted mb-2">{post.job_location_text || '-'}</p>
                                                    <p className="card-text">
                                                        {post.salary_min?.toLocaleString()} - {post.salary_max?.toLocaleString()} บาท
                                                    </p>
                                                </div>
                                                <div className="text-muted">
                                                    <small>
                                                        {post.posted_at
                                                            ? new Date(post.posted_at).toLocaleDateString('th-TH', {
                                                                year: '2-digit',
                                                                month: 'short',
                                                                day: '2-digit',
                                                            })
                                                            : '-'}
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="text-center text-muted p-4">
                                    <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                                    <h4>ไม่พบประกาศรับสมัครงาน</h4>
                                    <p>{filters.search || filters.jobpos_id ? 'ไม่พบประกาศตามเงื่อนไขที่เลือก' : 'ยังไม่มีประกาศรับสมัครงานที่เปิดรับ'}</p>
                                </div>
                            )}
                        </div>

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
                </div>
            </div>
        </div>
    );
}

export default PublicJobPostingListPage;