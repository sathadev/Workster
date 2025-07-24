// frontend/src/pages/Leavework/LeaveRequestHistoryPage.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, faInbox, faTimes, faInfoCircle, 
    faSort, faSortUp, faSortDown 
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

function LeaveRequestHistoryPage() {
    // --- State Management (เหมือนเดิม) ---
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchInput, setSearchInput] = useState(''); 
    const [filters, setFilters] = useState({ 
        search: '',
        leaveworktype_id: '', 
        status: ['approved', 'rejected']
    });
    const [sortConfig, setSortConfig] = useState({ key: 'leavework_daterequest', direction: 'desc' }); 
    const [currentPage, setCurrentPage] = useState(1); 
    const [meta, setMeta] = useState({}); 
    const [leaveTypes, setLeaveTypes] = useState([]); 

    // --- Data Fetching Hooks (เหมือนเดิม) ---
    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                const response = await api.get('/leave-types');
                setLeaveTypes(response.data);
            } catch (err) {
                console.error("Failed to fetch leave types for filter:", err);
            }
        };
        fetchLeaveTypes();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null); 
            try {
                const params = {
                    ...filters, 
                    sort: sortConfig.key,
                    order: sortConfig.direction,
                    page: currentPage,
                    limit: 10
                };
                const response = await api.get('/leave-requests', { params });
                setLeaveRequests(response.data.data || []); 
                setMeta(response.data.meta || {});
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters, sortConfig, currentPage]); 
    
    // --- Helper Functions and Handlers (เหมือนเดิม) ---
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

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
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1); 
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
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

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    // ======================= UX Improvement: โครงสร้าง JSX ที่แก้ไขใหม่ =======================
    return (
        <div>
            <h4 className="fw-bold">ประวัติคำขอลา (อนุมัติ/ไม่อนุมัติ)</h4>
            <p><Link to="/">หน้าหลัก</Link> / ประวัติคำขอลา</p> {/* ใช้ Link เพื่อ Navigation ที่ดีกว่า */}

            {/* ใช้ Card ครอบเนื้อหาหลักทั้งหมดเพื่อให้ดูเป็นกลุ่มก้อนและจัดกลาง */}
            <div className="card shadow-sm">
                <div className="card-body p-4">
                    {/* --- Filter & Search Section --- */}
                    <div className="row g-3 mb-3">
                        <div className="col-md-6"> 
                            <form onSubmit={handleSearchSubmit}>
                                <div className="input-group">
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
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="col-md-6"> 
                            <div className="input-group">
                                <label className="input-group-text">ประเภทการลา</label>
                                <select
                                    className="form-select"
                                    name="leaveworktype_id"
                                    value={filters.leaveworktype_id}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">ทั้งหมด</option>
                                    {leaveTypes.map(type => (
                                        <option key={type.leaveworktype_id} value={type.leaveworktype_id}>
                                            {type.leaveworktype_name}
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

                    {/* --- Table Section --- */}
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                        ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('leaveworktype_id')} style={{ cursor: 'pointer' }}>
                                        ประเภทการลา {sortConfig.key === 'leaveworktype_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th>หมายเหตุ</th>
                                    <th onClick={() => handleSort('leavework_daterequest')} style={{ cursor: 'pointer' }}>
                                        วันที่ลา {sortConfig.key === 'leavework_daterequest' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('leavework_status')} style={{ cursor: 'pointer' }}>
                                        สถานะ {sortConfig.key === 'leavework_status' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.length > 0 ? leaveRequests.map((leave) => (
                                    <tr key={leave.leavework_id}>
                                        <td>{leave.emp_name}</td>
                                        <td>{leave.leaveworktype_name}</td>
                                        <td>{leave.leavework_description}</td>
                                        <td>{formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}</td>
                                        <td><StatusBadge status={leave.leavework_status} /></td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted p-4">
                                            <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                            {filters.search || filters.leaveworktype_id ? 'ไม่พบข้อมูลคำขอลาตามเงื่อนไข' : 'ไม่มีประวัติคำขอลา'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- Pagination Section --- */}
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
            </div>
        </div>
    );
}

export default LeaveRequestHistoryPage;
