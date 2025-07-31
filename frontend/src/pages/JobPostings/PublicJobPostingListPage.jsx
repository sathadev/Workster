// frontend/src/pages/JobPostings/PublicJobPostingListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { publicApi } from '../../api/axios'; // publicApi น่าจะถูกตั้งค่าใน axios.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faTimes, faInbox, faInfoCircle,
    faSortUp, faSortDown, faBuilding, faExclamationTriangle, // faBuilding สำหรับชื่อบริษัท
    faLocationDot, faDollarSign, faCalendarDays // ไอคอนเพิ่มเติมที่อาจใช้ในรายละเอียด
} from '@fortawesome/free-solid-svg-icons'; // ตรวจสอบว่า icon เหล่านี้อยู่ใน library.add() ใน main.jsx
import { Form, Button, Alert, Card, Row, Col, Spinner } from 'react-bootstrap';

function PublicJobPostingListPage() {
    const navigate = useNavigate();

    const [jobPostings, setJobPostings] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        jobpos_id: '' // กรองตามตำแหน่งที่ประกาศ
    });
    const [sortConfig, setSortConfig] = useState({ key: 'posted_at', direction: 'desc' }); // เรียงตามวันที่ประกาศล่าสุด
    const [currentPage, setCurrentPage] = useState(1);
    const [positions, setPositions] = useState([]); // สำหรับ dropdown ตำแหน่งงาน

    // Fetch Job Positions for filter dropdown (ใช้ publicApi)
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                // สมมติว่า publicApi.get('/positions/public') คืนค่าตำแหน่งงานทั้งหมดสำหรับ Filter
                const response = await publicApi.get('/positions/public'); 
                setPositions(response.data);
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
                status: 'active', // Force 'active' status for public view
                sort: sortConfig.key, // ใช้ sort config
                order: sortConfig.direction, // ใช้ order config
                page: currentPage,
                limit: 10, // กำหนดจำนวนรายการต่อหน้า
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
    }, [filters, sortConfig, currentPage]); // เพิ่ม sortConfig ใน dependency

    useEffect(() => {
        fetchJobPostings();
    }, [fetchJobPostings]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1); // Reset page on filter change
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchInputChange = (e) => setSearchInput(e.target.value);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset page on search
        setFilters(prev => ({ ...prev, search: searchInput }));
    };

    const clearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: '' }));
    };

    const handleSort = (key) => {
        // ในหน้า Public Listing อาจไม่จำเป็นต้องมี Sort ในแต่ละคอลัมน์เหมือน Admin
        // ถ้าต้องการ sort ให้เพิ่มปุ่ม sort ใน UI และจัดการ logic
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        // รูปแบบ "23 ก.ค. 68"
        return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
    };

    if (loading) return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;

    return (
        <div className="container py-4">
            {/* Header Section */}
            <h1 className="fw-bold text-dark mb-4" style={{ fontSize: '2.5rem' }}>ประกาศรับสมัครงาน</h1>

            {/* Filter and Search Bar (Refined based on image) */}
            <div className="d-flex align-items-center mb-4">
                <Form onSubmit={handleSearchSubmit} className="d-flex align-items-center flex-grow-1 me-3">
                    <Form.Select name="jobpos_id" value={filters.jobpos_id} onChange={handleFilterChange} className="me-2" style={{ width: 'auto', minWidth: '150px', fontSize: '1rem', height: '38px' }}>
                        <option value="">ตำแหน่งงานทั้งหมด</option>
                        {positions.map(pos => (
                            <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                        ))}
                    </Form.Select>
                    <div className="input-group flex-grow-1" style={{ maxWidth: '400px' }}> {/* จำกัดความกว้าง input */}
                        <Form.Control
                            type="text"
                            placeholder="ค้นหาตำแหน่งงาน"
                            value={searchInput}
                            onChange={handleSearchInputChange}
                            style={{ fontSize: '1rem', height: '38px' }}
                        />
                        <Button variant="outline-secondary" type="submit" style={{ fontSize: '1rem', height: '38px' }}>
                            <FontAwesomeIcon icon={faSearch} />
                        </Button>
                        {filters.search && (
                            <Button onClick={clearSearch} variant="outline-danger" type="button" title="ล้างการค้นหา" style={{ fontSize: '1rem', height: '38px' }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </Button>
                        )}
                    </div>
                </Form>
            </div>

            {filters.search && (
                <div className="alert alert-info py-2" style={{ fontSize: '0.95rem' }}>
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                </div>
            )}

            {/* Job Listings (List Item Style) */}
            <div className="job-listings-list mt-4">
                {jobPostings.length > 0 ? jobPostings.map(post => (
                    <div key={post.job_posting_id} className="job-list-item p-3 mb-3 d-flex justify-content-between align-items-start shadow-sm" onClick={() => navigate(`/public/job-postings/${post.job_posting_id}`)} style={{ cursor: 'pointer', borderRadius: '0.5rem', border: '1px solid #eee' }}>
                        <div className="me-auto"> {/* push date to the right */}
                            <h5 className="fw-bold text-primary mb-1" style={{ fontSize: '1.4rem' }}>{post.job_title}</h5>
                            <p className="text-dark mb-1" style={{ fontSize: '1rem' }}>
                                <FontAwesomeIcon icon={faBuilding} className="me-1" /> {post.company_name || 'WorkSter'}
                            </p>
                            <p className="text-muted mb-1" style={{ fontSize: '0.95rem' }}>
                                <FontAwesomeIcon icon={faLocationDot} className="me-1" /> {post.job_location_text || '-'}
                            </p>
                            <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                                <FontAwesomeIcon icon={faDollarSign} className="me-1" /> {post.salary_min?.toLocaleString()} - {post.salary_max?.toLocaleString()} บาท
                            </p>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                            {formatDate(post.posted_at)}
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-muted p-5 mt-4 card shadow-sm">
                        <FontAwesomeIcon icon={faInbox} className="fa-4x mb-3" />
                        <h4 className="mb-2">ไม่พบประกาศรับสมัครงาน</h4>
                        <p>{filters.search || filters.jobpos_id ? 'ไม่พบประกาศตามเงื่อนไขที่เลือก' : 'ยังไม่มีประกาศรับสมัครงานที่เปิดรับ'}</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center mt-5">
                    <nav>
                        <ul className="pagination justify-content-center flex-wrap">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                <Button variant="outline-secondary" className="page-link" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} style={{ fontSize: '0.95rem' }}>
                                    ก่อนหน้า
                                </Button>
                            </li>
                            {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(page => (
                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                    <Button variant={currentPage === page ? 'primary' : 'outline-secondary'} className="page-link" onClick={() => handlePageChange(page)} style={{ fontSize: '0.95rem' }}>
                                        {page}
                                    </Button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage === meta.totalPages ? 'disabled' : ''}`}>
                                <Button variant="outline-secondary" className="page-link" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === meta.totalPages} style={{ fontSize: '0.95rem' }}>
                                    ถัดไป
                                </Button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
            {meta.totalPages > 1 && (
                <div className="text-center text-muted mt-3" style={{ fontSize: '0.9rem' }}>
                    หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)
                </div>
            )}
        </div>
    );
}

export default PublicJobPostingListPage;