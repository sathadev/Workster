// frontend/src/pages/SalaryListPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios'; // 📡 axios instance สำหรับเรียก backend
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faEdit, faMagnifyingGlass, faTimes, faInbox,
    faSortUp, faSortDown
} from '@fortawesome/free-solid-svg-icons';
import './SalaryListPage.css'; // สไตล์ของหน้านี้

function SalaryListPage() {
    // --- State Management ---
    const [salaries, setSalaries] = useState([]);      //  ลิสต์ข้อมูลเงินเดือน (แต่ละพนักงาน)
    const [meta, setMeta] = useState({});              
    const [loading, setLoading] = useState(true);      //  สถานะกำลังโหลด
    const [error, setError] = useState(null);          //  ข้อความผิดพลาด
    const [isSorting, setIsSorting] = useState(false); //  ไว้บอกว่าเกิดการ sort (ลดกระพริบโหลด)
    const [searchInput, setSearchInput] = useState('');//  ค่าที่พิมพ์ในช่องค้นหา (ยังไม่ส่งไป API จนกดค้นหา)
    const [filters, setFilters] = useState({           //  เงื่อนไขกรองที่ส่งไป backend
        search: '',
        jobpos_id: ''
    });
    const [positions, setPositions] = useState([]);    // รายการตำแหน่ง (ไว้ทำ dropdown filter)
    const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' }); // เรียงตามคอลัมน์/ทิศทาง
    const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบัน

    // Effects
    useEffect(() => {
        // โหลดรายการตำแหน่งสำหรับตัวกรอง
        api.get('/positions')
            .then(res => setPositions(res.data))
            .catch(err => console.error("Failed to fetch positions", err));
    }, []);

    useEffect(() => {
        // โหลดรายชื่อเงินเดือนตาม filters/sort/page
        const fetchSalaries = async () => {
            if (!isSorting) setLoading(true); // ถ้าเป็นการ sort อย่างเดียว อาจไม่ต้องโชว์โหลด
            setError(null);
            try {
                const params = {
                    ...filters,                 // search, jobpos_id
                    sort: sortConfig.key,       // คีย์คอลัมน์ที่ใช้เรียง (emp_name, salary_base, ...)
                    order: sortConfig.direction,// ทิศทาง asc/desc
                    page: currentPage,          // เพจปัจจุบัน
                    limit: 15                   // จำนวนต่อหน้า
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

    //  Handlers 
    const handleFilterChange = (e) => {
        //  เปลี่ยนตัวกรอง (ตำแหน่ง) -> รีเซ็ตไปหน้าแรก
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSearchSubmit = (e) => {
        // กดค้นหา: โยนค่า searchInput เข้า filters.search แล้วโหลดใหม่
        e.preventDefault();
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: searchInput }));
    };

    const clearSearch = () => {
        //  ล้างคำค้นหา
        setCurrentPage(1);
        setSearchInput('');
        setFilters(prev => ({ ...prev, search: '' }));
    };

    const handleSort = (key) => {
        //  คลิกหัวตารางเพื่อเรียงตามคอลัมน์ key
        setCurrentPage(1);
        setIsSorting(true);
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'; // ถ้าคลิกซ้ำคอลัมน์เดิม ให้สลับทิศทาง
        }
        setSortConfig({ key, direction });
    };

    const handlePageChange = (newPage) => {
        // เปลี่ยนหน้า (กันออกนอกช่วง)
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    // ฟอร์แมตตัวเลขให้เป็นเงินบาทแบบไทย 2 ตำแหน่ง
    const formatCurrency = (num) =>
        num ? Number(num).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    // Loading / Error guard 
    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            {/* เฮดดิ้งของหน้า */}
            <h4 className="fw-bold mb-3">จัดการเงินเดือน</h4>
            
            {/* 📦 การ์ดครอบเนื้อหาทั้งหมด (ฟิลเตอร์ + ตาราง + เพจจิเนชัน) */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    {/*  Filter Section */}
                    <div className="row g-2 mb-1">
                        {/* 🔎 ฟอร์มค้นหา */}
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
                                      <button
                                        onClick={clearSearch}
                                        className="btn btn-outline-danger"
                                        type="button"
                                        title="ล้างการค้นหา"
                                      >
                                        <FontAwesomeIcon icon={faTimes} />
                                      </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* ตัวกรองตามตำแหน่ง */}
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
                                    {positions.map(pos =>
                                      <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                                    )}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ตารางข้อมูลเงินเดือน */}
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    {/* คลิกหัวคอลัมน์เพื่อเรียง */}
                                    <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                        ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('jobpos_id')} style={{ cursor: 'pointer' }}>
                                        ตำแหน่ง {sortConfig.key === 'jobpos_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('salary_base')} style={{ cursor: 'pointer' }}>
                                        เงินเดือนพื้นฐาน {sortConfig.key === 'salary_base' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('total_salary')} style={{ cursor: 'pointer' }}>
                                        เงินเดือนรวม {sortConfig.key === 'total_salary' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salaries.length > 0 ? salaries.map((emp) => (
                                    <tr key={emp.emp_id}>
                                        {/* ชื่อ + ตำแหน่ง */}
                                        <td>{emp.emp_name}</td>
                                        <td>{emp.jobpos_name}</td>

                                        {/* ตัวเลขฟอร์แมตเงินแบบไทย */}
                                        <td className='text-end'>{formatCurrency(emp.salary_base)} บาท</td>
                                        <td className='text-end'>
                                            <strong className="text-success">{formatCurrency(emp.total_salary)} บาท</strong>
                                        </td>

                                        {/* ปุ่มแก้ไข -> ไปหน้า /salaries/edit/:emp_id */}
                                        <td>
                                            <Link to={`/salaries/edit/${emp.emp_id}`} className="btn btn-primary btn-sm">
                                                <FontAwesomeIcon icon={faEdit} className="me-1" /> แก้ไข
                                            </Link>
                                        </td>
                                    </tr>
                                )) : (
                                    // หน้าว่างเมื่อไม่มีข้อมูล
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

                    {/* Pagination Section */}
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

export default SalaryListPage;
