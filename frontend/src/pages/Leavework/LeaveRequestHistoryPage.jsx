// frontend/src/pages/Leavework/LeaveRequestHistoryPage.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, faInbox, faTimes, faInfoCircle, 
    faSort, faSortUp, faSortDown 
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom'; // เพิ่ม Link เข้ามา

function LeaveRequestHistoryPage() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSorting, setIsSorting] = useState(false); 

    const [searchInput, setSearchInput] = useState(''); 
    const [filters, setFilters] = useState({ 
        search: '',         
        leaveworktype_id: '', 
        status: ['approved', 'rejected'] // Default filter เป็น approved และ rejected
    });
    const [sortConfig, setSortConfig] = useState({ key: 'leavework_daterequest', direction: 'desc' }); 
    const [currentPage, setCurrentPage] = useState(1); 
    const [meta, setMeta] = useState({}); 

    const [leaveTypes, setLeaveTypes] = useState([]); 

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
                console.error("Failed to fetch leave requests:", err.response?.data || err.message);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters, sortConfig, currentPage]); 
    
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

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

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1); 
        // ไม่ต้องมี logic สำหรับ status === '' แล้ว เพราะ dropdown ถูกลบออกไป
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value 
        }));
    };
    
    const handleSort = (key) => {
        setCurrentPage(1); 
        let direction = 'asc';
        // ถ้าคลิกที่คอลัมน์เดิม ให้สลับทิศทาง
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

    return (
        <div>
            <h4 className="fw-bold">ประวัติคำขอลา (อนุมัติ/ไม่อนุมัติ)</h4>
            <p>หน้าหลัก / ประวัติคำขอลา</p>

            {/* --- Filter & Search Section --- */}
            <div className="row g-2 mb-3">
                {/* ช่องค้นหา: เปลี่ยนเป็น col-md-6 */}
                <div className="col-md-6"> 
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
                {/* Dropdown ประเภทการลา: เปลี่ยนเป็น col-md-6 */}
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
                {/* <--- ลบ: Dropdown สถานะออกไป เพราะหน้านี้แสดงเฉพาะ approved/rejected */}
                {/*
                <div className="col-md-4">
                    <div className="input-group">
                        <label className="input-group-text">สถานะ</label>
                        <select
                            className="form-select"
                            name="status"
                            value={Array.isArray(filters.status) ? '' : filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="">ทั้งหมด</option>
                            <option value="approved">อนุมัติ</option>
                            <option value="rejected">ไม่อนุมัติ</option>
                        </select>
                    </div>
                </div>
                */}
                {/* ---> */}
            </div>

            {filters.search && !error && (
                <div className="alert alert-info py-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                </div>
            )}
            {/* ------------------------------------------------------------- */}

            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            {/* Header สำหรับ Sort ชื่อ-สกุล */}
                            <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            {/* Header สำหรับ Sort ประเภทการลา */}
                            <th onClick={() => handleSort('leaveworktype_id')} style={{ cursor: 'pointer' }}>
                                ประเภทการลา {sortConfig.key === 'leaveworktype_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th>หมายเหตุ</th>
                            {/* Header สำหรับ Sort วันที่ลา */}
                            <th onClick={() => handleSort('leavework_daterequest')} style={{ cursor: 'pointer' }}>
                                วันที่ลา {sortConfig.key === 'leavework_daterequest' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('leavework_status')} style={{ cursor: 'pointer' }}>
                                สถานะ {sortConfig.key === 'leavework_status' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            {/* <--- ลบ: คอลัมน์ "ดำเนินการ" ออกไปจากหน้านี้ */}
                            {/* <th>ดำเนินการ</th> */}
                            {/* ---> */}
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.length > 0 ? leaveRequests.map((leave) => (
                            <tr key={leave.leavework_id}>
                                <td>{leave.emp_name}</td>
                                <td>{leave.leaveworktype_name}</td>
                                <td>{leave.leavework_description}</td>
                                <td>{formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}</td>
                                <td>
                                    <StatusBadge status={leave.leavework_status} />
                                </td>
                                {/* <--- ลบ: ปุ่มดำเนินการออกไปจากหน้านี้ */}
                                {/*
                                <td style={{minWidth: '180px'}}>
                                    {leave.leavework_status === 'pending' ? (
                                        <div className="d-flex justify-content-center gap-2">
                                            <button onClick={() => handleUpdateStatus(leave.leavework_id, 'approved')} className="btn btn-success btn-sm">อนุมัติ</button>
                                            <button onClick={() => handleUpdateStatus(leave.leavework_id, 'rejected')} className="btn btn-danger btn-sm">ไม่อนุมัติ</button>
                                        </div>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                                */}
                                {/* ---> */}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center text-muted p-4"> {/* colSpan เป็น 5 ตามจำนวนคอลัมน์ที่เหลือ */}
                                    <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                    {filters.search || filters.leaveworktype_id || filters.status ? 'ไม่พบข้อมูลคำขอลาตามเงื่อนไข' : 'ไม่มีประวัติคำขอลา'} {/* <--- ปรับข้อความ */}
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
            {/* ------------------------------------------------------------- */}
        </div>
    );
}

export default LeaveRequestHistoryPage;
