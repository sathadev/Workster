// frontend/src/pages/EmployeeListPage.jsx

import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faEye, faEdit, faTrash, faSort, faSortUp, faSortDown, 
    faPlus, faMagnifyingGlass, faTimes, faInbox, faInfoCircle, 
    faExclamationTriangle, faUserCircle 
} from '@fortawesome/free-solid-svg-icons';
import './EmployeeListPage.css';

// Helper function สำหรับแปลง Buffer รูปภาพ
function arrayBufferToBase64(buffer) {
    if (!buffer || !buffer.data) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer.data);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function EmployeeListPage() {
    const [employees, setEmployees] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' });

    // ใช้ useRef เพื่อจำค่า searchTerm ก่อนหน้า (สำหรับแก้ปัญหากระพริบ)
    const prevSearchTermRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                if (loading || searchTerm !== prevSearchTermRef.current) {
                    setLoading(true);
                }

                const params = {
                    search: searchTerm,
                    sort: sortConfig.key,
                    order: sortConfig.direction,
                    page: 1, 
                    limit: 100
                };
                
                // 2. (แก้ไข) เปลี่ยนมาใช้ 'api' และใช้ path สั้นๆ (baseURL จะถูกเติมให้อัตโนมัติ)
                const response = await api.get('/employees', { params });
                
                setEmployees(response.data.data || []);
                setMeta(response.data.meta || {});
                setError(null);
            } catch (err) {
                console.error('Failed to fetch employees:', err);
                setError('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
            } finally {
                setLoading(false);
                prevSearchTermRef.current = searchTerm;
            }
        };
        fetchEmployees();
    }, [searchTerm, sortConfig]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchTerm(searchInput);
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchTerm('');
    };

  const handleDelete = async (empId, empName) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบพนักงาน ${empName}?`)) {
            try {
                // 3. (แก้ไข) เปลี่ยนมาใช้ 'api' ในฟังก์ชัน delete ด้วย
                await api.delete(`/employees/${empId}`);
                
                setEmployees(currentEmployees => currentEmployees.filter(emp => emp.emp_id !== empId));
                alert('ลบพนักงานสำเร็จ');
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบพนักงาน';
                alert(errorMessage);
            }
        }
    };
    
  if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h1 className="fw-bold h4 mb-0">พนักงาน</h1>
                    <p className="text-muted mb-0">หน้าหลัก</p>
                </div>
                <button onClick={() => navigate('/employees/add')} className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> บันทึกข้อมูลพนักงานใหม่
                </button>
            </div>
            
            {error && (
                <div className="alert alert-danger">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2"/>
                    {error}
                </div>
            )}

       
            <form onSubmit={handleSearchSubmit} className="mb-3 search-form">
                <div className="input-group w-50">
                    <input 
                        type="text" 
                        className="form-control"
                        placeholder="ค้นหาชื่อพนักงานหรือตำแหน่ง"
                        aria-label="ค้นหา"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                    {searchTerm && (
                        <button onClick={clearSearch} className="btn btn-outline-danger" type="button">
                            <FontAwesomeIcon icon={faTimes} className="me-1" /> ล้างการค้นหา
                        </button>
                    )}
                </div>
            </form>
            
            {searchTerm && (
                <div className="alert alert-info">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2"/>
                    ผลการค้นหา "<strong>{searchTerm}</strong>" พบ {meta.totalItems || 0} รายการ
                </div>
            )}

            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th className="profile">โปรไฟล์</th>
                            <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th onClick={() => handleSort('jobpos_name')} style={{ cursor: 'pointer' }}>
                                ตำแหน่ง {sortConfig.key === 'jobpos_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
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
                                <td style={{minWidth: '220px'}}>
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
                                        <h4 className="mb-0">{searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ไม่มีข้อมูลพนักงาน'}</h4>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EmployeeListPage;