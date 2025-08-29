import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faInbox, faTimes, faInfoCircle,
    faSort, faSortUp, faSortDown, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { Button, Spinner, Alert } from 'react-bootstrap';

function EvaluationHistoryPage() {
    const navigate = useNavigate();
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        year: ''
    });
    const [sortConfig, setSortConfig] = useState({ key: 'create_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [meta, setMeta] = useState({});

    const [actualAvailableYears, setActualAvailableYears] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const params = {
                    search: filters.search,
                    year: filters.year,
                    sort: sortConfig.key,
                    order: sortConfig.direction,
                    page: currentPage,
                    limit: 10
                };
                const response = await api.get('/evaluations', { params });
                setEvaluations(response.data.data || []);
                setMeta(response.data.meta || {});

                const yearsFromData = [...new Set(
                    (response.data.data || [])
                        .map(item => new Date(item.create_at).getFullYear())
                        .filter(year => !isNaN(year))
                )].sort((a, b) => b - a);

                setActualAvailableYears(['', ...yearsFromData.map(String)]);
            } catch (err) {
                console.error("Failed to fetch evaluation history:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [filters, sortConfig, currentPage]);

    const handleSearchInputChange = (e) => {
        setSearchInput(e.target.value);
    };

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

    const handleYearChange = (e) => {
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, year: e.target.value }));
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

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <div className="mt-5 text-center"><Alert variant="danger">{error}</Alert></div>;

    return (
        <div>
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ประวัติการประเมินผล</h4>
            <div className="d-flex justify-content-start align-items-center mb-3">
                <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
                </Button>
            </div>

            {/* เพิ่มส่วนนี้เพื่อสร้างกรอบครอบทั้งหมด */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    <div className="row g-2 mb-3">
                        <div className="col-md-5">
                            <form onSubmit={handleSearchSubmit} className="search-form">
                                <div className="input-group w-100">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="ค้นหาตามชื่อพนักงาน..."
                                        value={searchInput}
                                        onChange={handleSearchInputChange}
                                        style={{ fontSize: '1rem' }}
                                    />
                                    <button className="btn btn-outline-secondary" type="submit" style={{ fontSize: '1rem' }}>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </button>
                                    {filters.search && (
                                        <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา" style={{ fontSize: '1rem' }}>
                                            <FontAwesomeIcon icon={faTimes} className="me-1" />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="col-md-3 offset-md-4">
                            <div className="input-group">
                                <label className="input-group-text bg-light text-dark" style={{ fontSize: '1rem' }}>ปีที่ประเมิน</label>
                                <select
                                    className="form-select"
                                    name="year"
                                    value={filters.year}
                                    onChange={handleYearChange}
                                    style={{ fontSize: '1rem' }}
                                >
                                    {actualAvailableYears.map(year => (
                                        <option key={year} value={year}>
                                            {year === '' ? 'ทั้งหมด' : year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {filters.search && !error && (
                        <div className="alert alert-info py-2" style={{ fontSize: '1rem' }}>
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                            ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th onClick={() => handleSort('create_at')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        วันที่ประเมิน {sortConfig.key === 'create_at' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('evaluatework_totalscore')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        คะแนนรวม {sortConfig.key === 'evaluatework_totalscore' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th style={{ fontSize: '1.05rem', color: '#333' }}>การประเมินผล</th>
                                </tr>
                            </thead>
                            <tbody>
                                {evaluations.length > 0 ? evaluations.map(evaluation => (
                                    <tr key={evaluation.evaluatework_id}>
                                        <td style={{ fontSize: '0.98rem' }}>{formatDate(evaluation.create_at)}</td>
                                        <td style={{ fontSize: '0.98rem' }}>{evaluation.emp_name}</td>
                                        <td style={{ fontSize: '0.98rem' }}>{evaluation.evaluatework_totalscore}</td>
                                        <td>
                                            <Link to={`/evaluations/result/${evaluation.evaluatework_id}`} className="btn btn-primary rounded-pill px-3" style={{ fontSize: '0.95rem' }}>
                                                ผลการประเมิน
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted p-4">
                                            <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block" />
                                            <span style={{ fontSize: '1rem' }}>{filters.search || filters.year ? `ไม่พบข้อมูลตามเงื่อนไข` : 'ไม่พบข้อมูล'}</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {meta && meta.totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)
                            </span>
                            <div className="btn-group">
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    style={{ fontSize: '0.95rem' }}
                                >
                                    ก่อนหน้า
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={!meta.totalPages || currentPage >= meta.totalPages}
                                    style={{ fontSize: '0.95rem' }}
                                >
                                    ถัดไป
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default EvaluationHistoryPage;