// frontend/src/pages/Evaluations/EvaluationPage.jsx
import { useState, useEffect, useCallback } from 'react';
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
    
    const [showSelfEvalModal, setShowSelfEvalModal] = useState(false);
    const [isEvaluationPeriod, setIsEvaluationPeriod] = useState(false);

    useEffect(() => {
        const checkEvaluationPeriod = () => {
            const today = new Date();
            const month = today.getMonth(); // 0-11 (ธันวาคม คือ 11)
            const date = today.getDate();   // 1-31
            
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

    const handleEvaluateClick = (employeeId) => {
        if (employeeId === user.emp_id) {
            setShowSelfEvalModal(true);
            return;
        }

        navigate(`/evaluations/form/${employeeId}`);
    };

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
    
    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>;

    if (error) {
        return (
            <div className="alert alert-danger mt-5" style={{ fontSize: '1rem' }}>
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>การประเมินผล</h4>
                <Link to="/evaluations/history" className="btn btn-outline-secondary" style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faHistory} className="me-2" /> ประวัติการประเมิน
                </Link>
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>หน้าหลัก / <span className="text-dark">การประเมินผล</span></p>
            
            {!isEvaluationPeriod && (
                <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    <span className="fw-bold">ยังไม่อยู่ในช่วงเวลาการประเมิน</span> การประเมินผลสามารถทำได้ในช่วงวันที่ 25-31 ธันวาคม ของทุกปี
                </div>
            )}

            <div className="row g-2 mb-3 mt-4"> {/* เพิ่ม mt-4 */}
                <div className="col-md-4">
                    <form onSubmit={handleSearchSubmit} className="search-form">
                        <div className="input-group w-100">
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="ค้นหาตามชื่อพนักงาน..."
                                value={searchInput} 
                                onChange={(e) => setSearchInput(e.target.value)} 
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
                <div className="col-md-4">
                    <div className="input-group">
                        <label className="input-group-text bg-light text-dark" style={{ fontSize: '1rem' }}>ตำแหน่ง</label>
                        <select
                            className="form-select"
                            name="jobpos_id"
                            value={filters.jobpos_id}
                            onChange={handleFilterChange}
                            style={{ fontSize: '1rem' }}
                        >
                            <option value="">ทั้งหมด</option>
                            {positions.map(pos => (
                                <option key={pos.jobpos_id} value={pos.jobpos_id}>
                                    {pos.jobpos_name}
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
                            <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('jobpos_id')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                ตำแหน่ง {sortConfig.key === 'jobpos_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>การประเมินผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length > 0 ? employees.map((emp) => (
                            <tr key={emp.emp_id}>
                                <td style={{ fontSize: '0.98rem' }}>{emp.emp_name}</td>
                                <td style={{ fontSize: '0.98rem' }}>{emp.jobpos_name}</td>
                                <td>
                                    <button 
                                        className={`btn ${isEvaluationPeriod ? 'btn-primary' : 'btn-secondary'} rounded-pill px-3`}
                                        onClick={() => handleEvaluateClick(emp.emp_id)}
                                        disabled={!isEvaluationPeriod}
                                        title={!isEvaluationPeriod ? 'นอกช่วงเวลาการประเมิน' : 'ประเมินผล'}
                                        style={{ fontSize: '0.95rem' }}
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
                                        <h4 className="mb-0 text-muted" style={{ fontSize: '1.2rem' }}>{filters.search || filters.jobpos_id ? 'ไม่พบข้อมูลตามเงื่อนไข' : 'ไม่มีข้อมูลพนักงาน'}</h4>
                                    </div>
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
            
            <Modal show={showSelfEvalModal} onHide={() => setShowSelfEvalModal(false)} centered>
                <Modal.Header closeButton className="bg-warning text-dark py-3"> {/* เปลี่ยนสี Header */}
                    <Modal.Title className="fw-bold" style={{ fontSize: '1.5rem' }}><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />แจ้งเตือน</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ fontSize: '1.05rem' }}>
                    คุณไม่สามารถประเมินตัวเองได้
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSelfEvalModal(false)} style={{ fontSize: '1rem' }}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default EvaluationPage;