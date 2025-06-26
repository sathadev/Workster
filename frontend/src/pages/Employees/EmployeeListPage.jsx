import { useState, useEffect, useCallback } from 'react'; // เพิ่ม useCallback
import api from '../../api/axios';
import socket from '../../socket';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEye, faEdit, faTrash, faSort, faSortUp, faSortDown,
    faPlus, faMagnifyingGlass, faTimes, faInbox, faInfoCircle,
    faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import './EmployeeListPage.css';

// Helper function
function arrayBufferToBase64(buffer) {
    if (!buffer || !buffer.data) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer.data);
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
}

function EmployeeListPage() {
    // --- State Management ---
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        jobpos_id: '',
        status: 'active'
    });
    const [searchInput, setSearchInput] = useState('');
    const [positions, setPositions] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    
    const navigate = useNavigate();

    // --- Effects ---

    // 1. ดึงข้อมูลตำแหน่งงาน (ทำครั้งเดียวเมื่อ component mount)
    useEffect(() => {
        api.get('/positions').then(res => setPositions(res.data)).catch(err => console.error("Failed to fetch positions", err));
    }, []);

    // 2. ฟังก์ชันสำหรับดึงข้อมูลพนักงาน (ใช้ useCallback เพื่อให้ฟังก์ชันไม่ถูกสร้างใหม่ทุกครั้งที่ render)
    // Dependencies ของฟังก์ชันนี้คือ state ที่มีผลต่อการเรียก API
    const fetchEmployees = useCallback(async () => {
        if (employees.length === 0 && !error) { 
            setLoading(true);
        }

        setError(null);
        try {
            const params = { 
                ...filters, 
                sort: sortConfig.key, 
                order: sortConfig.direction, 
                page: currentPage, 
                limit: 15 
            };
            const response = await api.get('/employees', { params });
            setEmployees(response.data.data || []);
            setMeta(response.data.meta || {});
        } catch (err) {
            console.error('Failed to fetch employees:', err);
            setError('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
        } finally {
            setLoading(false); 
        }
    }, [filters, sortConfig, currentPage]); 

    // 3. useEffect หลัก: เรียก fetchEmployees และจัดการ Socket.IO listeners
    useEffect(() => {
        fetchEmployees();

        socket.connect(); 

        const handleEmployeeChange = () => {
            console.log("Socket event related to employees received! Re-fetching data...");
            fetchEmployees(); 
        };

        socket.on('employee_created', handleEmployeeChange);
        socket.on('employee_updated', handleEmployeeChange);
        socket.on('employee_deleted', handleEmployeeChange);

        return () => {
            socket.off('employee_created', handleEmployeeChange);
            socket.off('employee_updated', handleEmployeeChange);
            socket.off('employee_deleted', handleEmployeeChange);
            socket.disconnect(); 
        };
    }, [fetchEmployees]); 

    // --- Handlers ---
    const handleDelete = async (empId, empName) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบพนักงาน ${empName}?`)) {
            try {
                await api.delete(`/employees/${empId}`);
                alert('ลบพนักงานสำเร็จ');
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบพนักงาน';
                alert(errorMessage);
            }
        }
    };

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
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        // *** การแก้ไขที่สำคัญ: เปลี่ยน 'jobpos_id' เป็น 'jobpos_name' เมื่อ Sort ตำแหน่ง ***
        let actualSortKey = key;
        if (key === 'jobpos_id') {
            actualSortKey = 'jobpos_name'; 
        }
        setSortConfig({ key: actualSortKey, direction });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    // --- Render ---
    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h1 className="fw-bold h4 mb-0">พนักงาน</h1>
                <button onClick={() => navigate('/employees/add')} className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> บันทึกข้อมูลพนักงานใหม่
                </button>
            </div>

            {error && <div className="alert alert-danger"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</div>}

            {/* --- Filter Section --- */}
            <div className="row g-2 mb-1">
                <div className="col-md-7">
                    <form onSubmit={handleSearchSubmit} className="mb-3 search-form">
                        <div className="input-group w-50">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ค้นหาชื่อพนักงานหรือตำแหน่ง..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button className="btn btn-outline-secondary" type="submit">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
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
                        <label className="input-group-text">ตำแหน่ง</label>
                        <select
                            className="form-select"
                            name="jobpos_id"
                            value={filters.jobpos_id}
                            onChange={handleFilterChange}
                        >
                            <option value="">ทุกตำแหน่ง</option>
                            {positions.map(pos => (
                                <option key={pos.jobpos_id} value={pos.jobpos_id}>
                                    {pos.jobpos_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="col-md-2">
                    <div className="input-group">
                        <label className="input-group-text">สถานะ</label>
                        <select
                            className="form-select"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                        >
                            <option value="active">ทำงานอยู่</option>
                            <option value="resigned">ลาออกแล้ว</option>
                            <option value="">ทั้งหมด</option>
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

            {/* --- Table and Pagination Section --- */}
            {!error && (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="profile">โปรไฟล์</th>
                                    <th >
                                        ชื่อ - สกุล 
                                    </th>
                                    <th>
                                        ตำแหน่ง 
                                    </th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length > 0 ? employees.map((employee) => (
                                    <tr key={employee.emp_id}>
                                        <td className="profile-cell">
                                            <img
                                                src={employee.emp_pic ? `data:image/jpeg;base64,${arrayBufferToBase64(employee.emp_pic)}` : '/images/profile.jpg'}
                                                alt={employee.emp_name}
                                                className="profile-image"
                                            />
                                        </td>
                                        <td>{employee.emp_name}</td>
                                        <td>{employee.jobpos_name}</td>
                                        <td style={{ minWidth: '220px' }}>
                                            <Link to={`/employees/view/${employee.emp_id}`} className="btn btn-info btn-sm me-2 text-white" title="ดูรายละเอียด">
                                                <FontAwesomeIcon icon={faEye} className='me-1' /> ดู
                                            </Link>
                                            <Link to={`/employees/edit/${employee.emp_id}`} className="btn btn-primary btn-sm me-2" title="แก้ไข">
                                                <FontAwesomeIcon icon={faEdit} className='me-1' /> แก้ไข
                                            </Link>
                                            <button onClick={() => handleDelete(employee.emp_id, employee.emp_name)} className="btn btn-danger btn-sm" title="ลบ">
                                                <FontAwesomeIcon icon={faTrash} className='me-1' /> ลบ
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="text-muted py-5 text-center">
                                            <div className="d-flex flex-column align-items-center">
                                                <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                                                <h4 className="mb-0">{filters.search || filters.jobpos_id || filters.status ? 'ไม่พบข้อมูลตามเงื่อนไข' : 'ไม่มีข้อมูลพนักงาน'}</h4>
                                            </div>
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
                </>
            )}
        </div>
    );
}

export default EmployeeListPage;
