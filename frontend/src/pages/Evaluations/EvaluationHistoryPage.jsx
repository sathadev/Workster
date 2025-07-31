// frontend/src/pages/Evaluations/EvaluationHistoryPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
    faSearch, faInbox, faTimes, faInfoCircle, // ไอคอนสำหรับ Search และ Info
    faSort, faSortUp, faSortDown // ไอคอนสำหรับ Sort
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // เพิ่ม import นี้

function EvaluationHistoryPage() {
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

    // State สำหรับเก็บปีที่มีข้อมูลจริง
    const [actualAvailableYears, setActualAvailableYears] = useState([]);

    // Effect สำหรับดึงปีที่มีข้อมูลการประเมินจาก Backend
    useEffect(() => {
        const fetchYears = async () => {
            try {
                const response = await api.get('/evaluations/years');
                // Backend คืนค่าเป็น array ของ strings เช่น ['2023', '2024']
                setActualAvailableYears(['', ...response.data]); // เพิ่มค่าว่างสำหรับ "ทั้งหมด"
            } catch (err) {
                console.error("Failed to fetch available evaluation years:", err);
                // setError("ไม่สามารถโหลดข้อมูลปีการประเมินได้"); // อาจจะแสดง error หรือไม่ก็ได้
            }
        };
        fetchYears();
    }, []); // รันแค่ครั้งเดียวตอนโหลด Component

    // Effect สำหรับดึงประวัติการประเมิน
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
            } catch (err) {
                console.error("Failed to fetch evaluation history:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [filters, sortConfig, currentPage]); // Dependencies: เมื่อ filters, sortConfig, currentPage เปลี่ยน จะดึงข้อมูลใหม่

    // ... (Handlers เหมือนเดิม) ...
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

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">ประวัติการประเมินผล</h4>
            <p><Link to="/evaluations">การประเมินผล</Link> / ประวัติการประเมิน</p>

            {/* --- Filter & Search Section --- */}
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
                <div className="col-md-3 offset-md-4">
                    <div className="input-group">
                        <label className="input-group-text">ปีที่ประเมิน</label>
                        <select
                            className="form-select"
                            name="year"
                            value={filters.year}
                            onChange={handleYearChange}
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
                <div className="alert alert-info py-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                </div>
            )}

            {/* ตารางแสดงข้อมูล */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th onClick={() => handleSort('create_at')} style={{ cursor: 'pointer' }}>
                                วันที่ประเมิน {sortConfig.key === 'create_at' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('evaluatework_totalscore')} style={{ cursor: 'pointer' }}>
                                คะแนนรวม {sortConfig.key === 'evaluatework_totalscore' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th>การประเมินผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluations.length > 0 ? evaluations.map(evaluation => (
                            <tr key={evaluation.evaluatework_id}>
                                <td>{formatDate(evaluation.create_at)}</td>
                                <td>{evaluation.emp_name}</td>
                                <td>{evaluation.evaluatework_totalscore}</td>
                                <td>
                                    <Link to={`/evaluations/result/${evaluation.evaluatework_id}`} className="btn btn-primary rounded-pill px-3">
                                        ผลการประเมิน
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted p-4">
                                    <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block" />
                                    {filters.search || filters.year ? `ไม่พบข้อมูลตามเงื่อนไข` : 'ไม่พบข้อมูล'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {meta && meta.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-muted">
                        หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)
                    </span>
                    <div className="btn-group">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            ก่อนหน้า
                        </button>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!meta.totalPages || currentPage >= meta.totalPages}
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EvaluationHistoryPage;