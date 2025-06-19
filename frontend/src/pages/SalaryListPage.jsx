// frontend/src/pages/SalaryListPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faMagnifyingGlass, faTimes, faInfoCircle, faInbox } from '@fortawesome/free-solid-svg-icons';
import SalarySummary from '../components/SalarySummary';
import './SalaryListPage.css';

function SalaryListPage() {
    const [salaries, setSalaries] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State สำหรับการค้นหา
    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchSalaries = async () => {
            try {
                setLoading(true);
                const params = { search: searchTerm, page: 1, limit: 100 };
                const response = await api.get('/salaries', { params });
                setSalaries(response.data.data || []);
                setMeta(response.data.meta || {});
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน");
            } finally {
                setLoading(false);
            }
        };
        fetchSalaries();
    }, [searchTerm]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchTerm(searchInput);
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchTerm('');
    };

    const formatCurrency = (num) => num ? Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">จัดการเงินเดือน</h4>
            </div>
            <p>หน้าหลัก</p>

            {/* --- REFACTORED: ใช้ฟอร์มค้นหาดีไซน์เดียวกับหน้า Employee --- */}
            <form onSubmit={handleSearchSubmit} className="mb-3 search-form">
                <div className="input-group w-50">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="ค้นหาชื่อพนักงานหรือตำแหน่ง" 
                        value={searchInput} 
                        onChange={(e) => setSearchInput(e.target.value)} 
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </button>
                    {searchTerm && (
                        <button onClick={clearSearch} className="btn btn-outline-danger" type="button">
                            <FontAwesomeIcon icon={faTimes} className="me-1"/>ล้างการค้นหา
                        </button>
                    )}
                </div>
            </form>

            {searchTerm && <div className="alert alert-info">ผลการค้นหา "<strong>{searchTerm}</strong>" พบ {meta.totalItems || 0} รายการ</div>}

            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ชื่อ - สกุล</th>
                            <th>ตำแหน่ง</th>
                            <th>เงินเดือนพื้นฐาน</th>
                            <th>เงินเดือนรวม</th>
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
                        )) :  (
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

            {/* <SalarySummary employees={salaries} /> */}
        </div>
    );
}

export default SalaryListPage;