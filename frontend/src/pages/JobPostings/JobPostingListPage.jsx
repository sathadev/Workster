// frontend/src/pages/JobPostings/JobPostingListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faEye, faEdit, faTrash, faSearch, faTimes,
    faInbox, faInfoCircle, faSortUp, faSortDown, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

function JobPostingListPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [jobPostings, setJobPostings] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        status: '', // 'active', 'closed', 'draft'
        jobpos_id: '' // กรองตามตำแหน่งที่ประกาศ
    });
    const [sortConfig, setSortConfig] = useState({ key: 'posted_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [positions, setPositions] = useState([]); // สำหรับ dropdown ตำแหน่งงาน

    // Fetch Job Positions for filter dropdown
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await api.get('/positions');
                setPositions(response.data);
            } catch (err) {
                console.error("Failed to fetch positions for job postings:", err);
            }
        };
        fetchPositions();
    }, []);

    // Fetch Job Postings
    const fetchJobPostings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // ตรวจสอบสิทธิ์ก่อนเรียก API
            if (!user || ![1, 2, 3].includes(user.jobpos_id)) {
                setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                setLoading(false);
                return;
            }

            const params = {
                ...filters,
                sort: sortConfig.key,
                order: sortConfig.direction,
                page: currentPage,
                limit: 10,
            };
            const response = await api.get('/job-postings', { params });
            setJobPostings(response.data.data || []);
            setMeta(response.data.meta || {});
        } catch (err) {
            console.error("Failed to fetch job postings:", err.response?.data || err.message);
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงาน");
        } finally {
            setLoading(false);
        }
    }, [filters, sortConfig, currentPage, user]);

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

    const handleDelete = async (id, title) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบประกาศ "${title}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
            return;
        }
        try {
            await api.delete(`/job-postings/${id}`);
            alert('ลบประกาศรับสมัครงานสำเร็จ!');
            fetchJobPostings(); // Refresh list
        } catch (err) {
            console.error("Error deleting job posting:", err.response?.data || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบประกาศ');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // ตรวจสอบสิทธิ์การเข้าถึงหน้านี้
    if (!user || ![1, 2, 3].includes(user.jobpos_id)) {
        return (
            <Alert variant="danger" className="mt-5 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </Alert>
        );
    }

    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">จัดการประกาศรับสมัครงาน</h4>
                <Button variant="outline-primary" onClick={() => navigate('/job-postings/add')}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> สร้างประกาศใหม่
                </Button>
            </div>
            <p>หน้าหลัก / จัดการประกาศรับสมัครงาน</p>

            {/* Filter Section */}
            <div className="row g-2 mb-3">
                <div className="col-md-4">
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
                <div className="col-md-3">
                    <div className="input-group">
                        <label className="input-group-text">สถานะ</label>
                        <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                            <option value="">ทั้งหมด</option>
                            <option value="active">เปิดรับสมัคร</option>
                            <option value="closed">ปิดรับสมัคร</option>
                            <option value="draft">ฉบับร่าง</option>
                        </Form.Select>
                    </div>
                </div>
                <div className="col-md-3">
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

            {/* Table Section */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th onClick={() => handleSort('job_title')} style={{ cursor: 'pointer' }}>
                                ตำแหน่งที่ประกาศ {sortConfig.key === 'job_title' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('jobpos_id')} style={{ cursor: 'pointer' }}>
                                ตำแหน่งในระบบ {sortConfig.key === 'jobpos_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th>ช่วงเงินเดือน</th>
                            <th onClick={() => handleSort('job_status')} style={{ cursor: 'pointer' }}>
                                สถานะ {sortConfig.key === 'job_status' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('posted_at')} style={{ cursor: 'pointer' }}>
                                วันที่ประกาศ {sortConfig.key === 'posted_at' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th>ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobPostings.length > 0 ? jobPostings.map(post => (
                            <tr key={post.job_posting_id}>
                                <td>{post.job_title}</td>
                                <td>{post.jobpos_name || '-'}</td>
                                <td>{post.salary_min?.toLocaleString()} - {post.salary_max?.toLocaleString()} บาท</td>
                                <td>{post.job_status === 'active' ? 'เปิดรับ' : post.job_status === 'closed' ? 'ปิดรับ' : 'ฉบับร่าง'}</td>
                                <td>{formatDate(post.posted_at)}</td>
                                <td style={{ minWidth: '180px' }}>
                                    <Link to={`/job-postings/view/${post.job_posting_id}`} className="btn btn-info btn-sm me-2 text-white" title="ดูรายละเอียด">
                                        <FontAwesomeIcon icon={faEye} /> ดู
                                    </Link>
                                    <Link to={`/job-postings/edit/${post.job_posting_id}`} className="btn btn-primary btn-sm me-2" title="แก้ไข">
                                        <FontAwesomeIcon icon={faEdit} /> แก้ไข
                                    </Link>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(post.job_posting_id, post.job_title)} title="ลบ">
                                        <FontAwesomeIcon icon={faTrash} /> ลบ
                                    </Button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="text-center text-muted p-4">
                                    <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                                    <h4>ไม่พบข้อมูลประกาศรับสมัครงาน</h4>
                                    <p>{filters.search || filters.status || filters.jobpos_id ? 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก' : 'ยังไม่มีประกาศรับสมัครงาน'}</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
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
    );
}

export default JobPostingListPage;
