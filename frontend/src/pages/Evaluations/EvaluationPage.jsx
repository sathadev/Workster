// frontend/src/pages/Evaluations/EvaluationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHistory, faSearch, faInbox, faInfoCircle, faExclamationTriangle,
    faSort, faSortUp, faSortDown,
    faTimes
} from '@fortawesome/free-solid-svg-icons';

function EvaluationPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // --- State Management (ส่วนนี้เหมือนเดิม) ---
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSorting, setIsSorting] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        jobpos_id: '',
    });
    const [searchInput, setSearchInput] = useState('');
    const [positions, setPositions] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [refetchTrigger, setRefetchTrigger] = useState(0);
    
    // ======================= 1. เพิ่ม State สองส่วนกลับมาครบถ้วน =======================
    const [showSelfEvalModal, setShowSelfEvalModal] = useState(false);
    const [isEvaluationPeriod, setIsEvaluationPeriod] = useState(false);
    // =================================================================================

    // useEffect สำหรับตรวจสอบช่วงเวลา
    useEffect(() => {
        const checkEvaluationPeriod = () => {
            const today = new Date();
            const month = today.getMonth(); // 0-11 (ธันวาคม คือ 11)
            const date = today.getDate();   // 1-31
            
            // ตรวจสอบว่าเป็นเดือนธันวาคม และวันที่ 25-31 หรือไม่
            if (month === 11 && date >= 25) {
                setIsEvaluationPeriod(true);
            } else {
                // สำหรับการทดสอบ สามารถ uncomment บรรทัดล่างเพื่อให้ประเมินได้ตลอดเวลา
                // setIsEvaluationPeriod(true); 
                setIsEvaluationPeriod(false);
            }
        };
        checkEvaluationPeriod();
    }, []);

    // Effect อื่นๆ (เหมือนเดิม)
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await api.get('/positions');
                setPositions(response.data);
            } catch (err) {
                console.error("Failed to fetch positions for filter:", err);
            }
        };
        fetchPositions();
    }, []); 

    useEffect(() => {
        const fetchEmployeesForEvaluation = async () => {
            if (!isSorting) setLoading(true);
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
                console.error('Failed to fetch employees for evaluation:', err);
                setError('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงานสำหรับประเมิน');
            } finally {
                setLoading(false); 
                setIsSorting(false); 
            }
        };
        fetchEmployeesForEvaluation();
    }, [filters, sortConfig, currentPage, refetchTrigger, isSorting]);

    // ======================= 2. แก้ไข handleEvaluateClick ให้สมบูรณ์ =======================
    const handleEvaluateClick = (employeeId) => {
        // ตรวจสอบการประเมินตัวเองก่อนเป็นอันดับแรก
        // ฟังก์ชันนี้จะทำงานเมื่อคลิกปุ่มเท่านั้น ซึ่งปุ่มจะกดได้ก็ต่อเมื่ออยู่ใน isEvaluationPeriod
        if (employeeId === user.emp_id) {
            setShowSelfEvalModal(true); // ถ้าใช่ ให้แสดง Modal แจ้งเตือน
            return; // และหยุดทำงานทันที
        }

        // ถ้าไม่ใช่การประเมินตัวเอง ก็ไปที่หน้าฟอร์ม
        navigate(`/evaluations/form/${employeeId}`);
    };
    // =======================================================================================

    // Handlers อื่นๆ (เหมือนเดิม)
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1);
        setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
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
    
    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            {/* ส่วนหัวและ Filter (เหมือนเดิม) */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">การประเมินผล</h4>
                <Link to="/evaluations/history" className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faHistory} className="me-2" /> ประวัติการประเมิน
                </Link>
            </div>
            {/* ... (โค้ดส่วน Filter) ... */}
            
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
                                    {/* 3. ปุ่มที่ใช้ Logic ที่แก้ไขแล้ว */}
                                    <button 
                                        className={`btn ${isEvaluationPeriod ? 'btn-primary' : 'btn-secondary'} rounded-pill px-3`}
                                        onClick={() => handleEvaluateClick(emp.emp_id)}
                                        disabled={!isEvaluationPeriod}
                                        title={!isEvaluationPeriod ? 'นอกช่วงเวลาการประเมิน' : 'ประเมินผล'}
                                    >
                                        ประเมินผล
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr> 
                                <td colSpan="3" className="text-center text-muted p-4">
                                    <div className="d-flex flex-column align-items-center">
                                        <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                        <h4 className="mb-0">{filters.search || filters.jobpos_id ? 'ไม่พบข้อมูลตามเงื่อนไข' : 'ไม่มีข้อมูลพนักงาน'}</h4>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination (เหมือนเดิม) */}
            {meta && meta.totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                    {/* ... โค้ด Pagination ... */}
                </div>
            )}
            
            {/* ======================= 4. นำ Modal สำหรับแจ้งเตือนกลับมา ======================= */}
            <Modal show={showSelfEvalModal} onHide={() => setShowSelfEvalModal(false)} centered>
                <Modal.Header closeButton className="bg-warning">
                    <Modal.Title><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />แจ้งเตือน</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    คุณไม่สามารถประเมินตัวเองได้
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSelfEvalModal(false)}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
            {/* =================================================================================== */}
        </div>
    );
}

export default EvaluationPage;