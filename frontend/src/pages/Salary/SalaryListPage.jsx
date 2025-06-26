// frontend/src/pages/Salary/SalaryListPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEdit, faMagnifyingGlass, faTimes, faInfoCircle, faInbox,
    faSort, faSortUp, faSortDown 
} from '@fortawesome/free-solid-svg-icons';
import './SalaryListPage.css';

function SalaryListPage() {
    // --- State Management ---
    const [salaries, setSalaries] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSorting, setIsSorting] = useState(false);

    // State สำหรับการค้นหาและ Filter
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        jobpos_id: ''
    });
    const [positions, setPositions] = useState([]);

    // State สำหรับการเรียงลำดับและแบ่งหน้า
    const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    
    // --- Effects ---
    // ดึงข้อมูลตำแหน่งงานมาใส่ใน dropdown filter
    useEffect(() => {
        api.get('/positions')
           .then(res => setPositions(res.data))
           .catch(err => console.error("Failed to fetch positions", err));
    }, []);

    // ดึงข้อมูลเงินเดือนใหม่ทุกครั้งที่ state เหล่านี้เปลี่ยน
    useEffect(() => {
        const fetchSalaries = async () => {
            if (!isSorting) setLoading(true);
            setError(null);
            try {
                const params = {
                    ...filters,
                    sort: sortConfig.key,
                    order: sortConfig.direction,
                    page: currentPage,
                    limit: 15 // แสดงหน้าละ 15 รายการ
                };
                const response = await api.get('/salaries', { params });
                setSalaries(response.data.data || []);
                setMeta(response.data.meta || {});
            } catch (err) {
                console.error("Failed to fetch salaries:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน");
            } finally {
                setLoading(false);
                setIsSorting(false);
            }
        };
        fetchSalaries();
    }, [filters, sortConfig, currentPage]);

    // --- Handlers ---
    const handleFilterChange = (e) => {
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: searchInput }));
    };

    const clearSearch = () => {
        setCurrentPage(1);
        setSearchInput('');
        setFilters(prev => ({ ...prev, search: '' }));
    };

    const handleSort = (key) => {
        setCurrentPage(1);
        setIsSorting(true);
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
    
    const formatCurrency = (num) => num ? Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold mb-3">จัดการเงินเดือน</h4>

            {/* --- Filter Section --- */}
            <div className="row g-2 mb-1">
                <div className="col-md-7">
                    <form onSubmit={handleSearchSubmit} className="mb-3 search-form">
                        <div className="input-group w-50">
                            <input type="text" className="form-control" placeholder="ค้นหาชื่อพนักงานหรือตำแหน่ง..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                            <button className="btn btn-outline-secondary" type="submit"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
                            {filters.search && <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา"><FontAwesomeIcon icon={faTimes} /></button>}
                        </div>
                    </form>
                </div>
                <div className="col-md-5">
                    <div className="input-group">
                        <label className="input-group-text">ตำแหน่ง</label>
                        <select className="form-select" name="jobpos_id" value={filters.jobpos_id} onChange={handleFilterChange}>
                            <option value="">ทุกตำแหน่ง</option>
                            {positions.map(pos => <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th onClick={() => handleSort('emp_name')} style={{cursor: 'pointer'}}>ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}</th>
                            <th onClick={() => handleSort('jobpos_id')} style={{cursor: 'pointer'}}>ตำแหน่ง {sortConfig.key === 'jobpos_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}</th>
                            <th onClick={() => handleSort('salary_base')} style={{cursor: 'pointer'}}>เงินเดือนพื้นฐาน {sortConfig.key === 'salary_base' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}</th>
                            <th onClick={() => handleSort('total_salary')} style={{cursor: 'pointer'}}>เงินเดือนรวม {sortConfig.key === 'total_salary' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salaries.length > 0 ? salaries.map((emp) => (
                            <tr key={emp.emp_id}>
                                <td>{emp.emp_name}</td>
                                <td>{emp.jobpos_name}</td>
                                <td className='text-end'>{formatCurrency(emp.salary_base)} บาท</td>
                                <td className='text-end'><strong className="text-success">{formatCurrency(emp.total_salary)} บาท</strong></td>
                                <td>
                                    <Link to={`/salaries/edit/${emp.emp_id}`} className="btn btn-primary btn-sm">
                                        <FontAwesomeIcon icon={faEdit} className="me-1" /> แก้ไข
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-muted py-5 text-center">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                                        <h4 className="mb-0">ไม่พบข้อมูล</h4>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Pagination Section --- */}
            {meta && meta.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-muted">หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)</span>
                    <div className="btn-group">
                        <button className="btn btn-outline-secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>ก่อนหน้า</button>
                        <button className="btn btn-outline-secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={!meta.totalPages || currentPage >= meta.totalPages}>ถัดไป</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SalaryListPage;