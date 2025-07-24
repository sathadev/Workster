// frontend/src/pages/Evaluations/EvaluationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory, faSearch, faInbox, faInfoCircle, faExclamationTriangle,
    faSort, faSortUp, faSortDown, // เพิ่ม icon สำหรับ Sort
    faTimes // <--- เพิ่ม: Import faTimes เข้ามา (แก้ไข: ตรวจสอบว่า import ถูกต้อง)
} from '@fortawesome/free-solid-svg-icons';

function EvaluationPage() {
    const { user } = useAuth(); // ดึงข้อมูล user ที่ล็อกอินอยู่มาใช้
    const navigate = useNavigate();
    
    // --- State Management สำหรับ Search, Sort, Filter และ Pagination ---
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState({}); // สำหรับ Pagination metadata
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSorting, setIsSorting] = useState(false); // สำหรับควบคุม Loading State ตอน Sort

    const [filters, setFilters] = useState({
        search: '',
        jobpos_id: '', // ค่าว่างหมายถึง "ทุกตำแหน่ง"
        // status: 'active' // <--- ลบ: ไม่ใช้ filter สถานะแล้ว
    });
    
    const [searchInput, setSearchInput] = useState(''); // State สำหรับช่องค้นหาที่ผู้ใช้พิมพ์
    const [positions, setPositions] = useState([]); // State สำหรับรายการตำแหน่งงานใน dropdown
    const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' }); // State สำหรับการเรียงลำดับ
    const [currentPage, setCurrentPage] = useState(1); // State สำหรับหน้าปัจจุบัน (Pagination)
    const [refetchTrigger, setRefetchTrigger] = useState(0); // State เพื่อบังคับให้ useEffect ทำงานใหม่ (เช่น หลังลบพนักงานในหน้า EmployeeList)
    // ---------------------------------------------------------------

    // Effect สำหรับดึงรายการตำแหน่งงาน (Job Positions)
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                // ดึงตำแหน่งงานทั้งหมดจาก Backend (jobposModel.js getAll จะกรองตาม companyId แล้ว)
                const response = await api.get('/positions');
                setPositions(response.data);
            } catch (err) {
                console.error("Failed to fetch positions for filter:", err);
            }
        };
        fetchPositions();
    }, []); 

    // Effect สำหรับดึงข้อมูลพนักงานที่ต้องการประเมิน (หลักของหน้านี้)
    useEffect(() => {
        const fetchEmployeesForEvaluation = async () => {
            if (!isSorting) {
                setLoading(true);
            }
            setError(null); 
            try {
                // สร้าง Parameters สำหรับส่งไป Backend API
                const params = {
                    ...filters, // รวม search, jobpos_id
                    sort: sortConfig.key, // ฟิลด์ที่ใช้เรียงลำดับ
                    order: sortConfig.direction, // ทิศทางการเรียงลำดับ
                    page: currentPage, // หน้าปัจจุบัน
                    limit: 15 // จำนวนรายการต่อหน้า (หรือตามที่คุณต้องการ)
                };
                // เรียก API เพื่อดึงข้อมูลพนักงาน (ใช้ API /employees ที่รองรับ Filter/Sort อยู่แล้ว)
                const response = await api.get('/employees', { params });
                setEmployees(response.data.data || []); 
                setMeta(response.data.meta || {}); 
            } catch (err) {
                console.error('Failed to fetch employees for evaluation:', err);
                setError('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงานสำหรับประเมิน');
            } finally {
                setLoading(false); 
                setIsSorting(false); 
            }
        };
        fetchEmployeesForEvaluation();
    }, [filters, sortConfig, currentPage, refetchTrigger, isSorting]); // Dependencies เหมือน EmployeeListPage.jsx

    const handleEvaluateClick = (employeeId) => {
        if (employeeId === user.emp_id) {
            // ถ้าพยายามประเมินตัวเอง ให้เปิด Modal
            setShowSelfEvalModal(true);
        } else {
            // ถ้าประเมินคนอื่น ให้ไปที่หน้าฟอร์ม
            navigate(`/evaluations/form/${employeeId}`);
        }
    };

    // --- Handlers สำหรับ Search, Sort, Filter และ Pagination ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1); // เมื่อ Filter เปลี่ยน ให้กลับไปหน้าแรก
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value 
        }));
    };
    
    const handleSearchSubmit = (e) => {
        e.preventDefault(); 
        setCurrentPage(1); // เมื่อค้นหา ให้กลับไปหน้าแรก
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
    // -------------------------------------------------------------

    // State และ Handler สำหรับ Modal แจ้งเตือนเมื่อประเมินตัวเอง
    const [showSelfEvalModal, setShowSelfEvalModal] = useState(false);


    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">การประเมินผล</h4>
                <Link to="/evaluations/history" className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faHistory} className="me-2" /> ประวัติการประเมิน
                </Link>
            </div>
            <p>หน้าหลัก</p>

            {/* --- Filter & Search Section (เหมือน EmployeeListPage.jsx) --- */}
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
                {/* <--- ปรับขนาด col-md-5 เพื่อให้ช่องตำแหน่งงานกว้างขึ้น (เดิม col-md-3) */}
                <div className="col-md-5"> 
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
                                // ตำแหน่งงาน (jobpos) อาจเป็น Global หรือ Tenant-Specific ก็ได้
                                // ถ้าเป็น Global และมี ID ซ้ำกันในตำแหน่ง Tenant-Specific จะเกิดปัญหา key prop ซ้ำ
                                // ควรตรวจสอบให้แน่ใจว่า jobpos_id ไม่ซ้ำกัน หรือใช้ key ที่ไม่ซ้ำ (เช่น `${pos.jobpos_id}-${pos.company_id || 'global'}`)
                                <option key={pos.jobpos_id} value={pos.jobpos_id}>
                                    {pos.jobpos_name}
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
            {/* ------------------------------------------------------------- */}

            {/* ส่วนของตาราง */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('jobpos_id')} style={{ cursor: 'pointer' }}>
                                ตำแหน่ง {sortConfig.key === 'jobpos_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th>การประเมินผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length > 0 ? employees.map((emp) => (
                            <tr key={emp.emp_id}>
                                <td>{emp.emp_name}</td>
                                <td>{emp.jobpos_name}</td>
                                <td>
                                    <button 
                                        className="btn btn-primary rounded-pill px-3"
                                        onClick={() => handleEvaluateClick(emp.emp_id)}
                                    >
                                        ประเมินผล
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            // <--- แก้ไข: รวมแถว "ไม่พบข้อมูล" ให้เป็น <tr> เดียว
                            <tr> 
                                <td colSpan="3" className="text-center text-muted p-4">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                        <h4 className="mb-0">{filters.search || filters.jobpos_id /* || filters.status */ ? 'ไม่พบข้อมูลตามเงื่อนไข' : 'ไม่มีข้อมูลพนักงาน'}</h4>
                                    </div>
                                </td>
                            </tr>
                            // --->
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Pagination Section (เหมือน EmployeeListPage.jsx) --- */}
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

            {/* Modal สำหรับแจ้งเตือนเมื่อประเมินตัวเอง (เหมือนเดิม) */}
            <Modal show={showSelfEvalModal} onHide={() => setShowSelfEvalModal(false)} centered>
                <Modal.Header closeButton className="bg-warning">
                    <Modal.Title>แจ้งเตือน</Modal.Title>
                </Modal.Header>
                <Modal.Body>คุณไม่สามารถประเมินตัวเองได้</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSelfEvalModal(false)}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default EvaluationPage;
