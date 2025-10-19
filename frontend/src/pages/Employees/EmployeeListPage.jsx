// frontend/src/pages/EmployeeListPage.jsx

import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEdit, faTrash, faSortUp, faSortDown,
  faPlus, faMagnifyingGlass, faTimes, faInbox, faInfoCircle,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import './EmployeeListPage.css';

// path พื้นฐานของรูปโปรไฟล์จากฝั่ง backend
const BASE_URL_UPLOAD = 'http://localhost:5000/uploads/profile_pics/';

function EmployeeListPage() {
  // เก็บข้อมูล/สถานะหลักของหน้า
  const [employees, setEmployees] = useState([]);     // รายชื่อพนักงาน (ข้อมูลตาราง)
  const [meta, setMeta] = useState({});               // ข้อมูลเพจจิเนชัน {currentPage, totalPages, totalItems}
  const [loading, setLoading] = useState(true);       // สถานะกำลังโหลด
  const [error, setError] = useState(null);           // ข้อความ error
  const [isSorting, setIsSorting] = useState(false);  // ธงตอนกด sort (กันกระพริบโหลด)

  // ตัวกรองข้อมูลที่ส่งไป backend
  const [filters, setFilters] = useState({
    search: '',       // คำค้น (ชื่อ/ตำแหน่ง)
    jobpos_id: '',    // ตำแหน่ง
    status: 'active'  // สถานะการทำงาน (active/resigned/ทั้งหมด)
  });

  // ค่าช่องค้นหา (local UI state) → ค่อยส่งเข้า filters เมื่อ submit
  const [searchInput, setSearchInput] = useState('');

  // รายการตำแหน่งทั้งหมด (ไว้ใส่ dropdown filter)
  const [positions, setPositions] = useState([]);

  // ตั้งค่าการเรียงลำดับ (คอลัมน์+ทิศทาง)
  const [sortConfig, setSortConfig] = useState({ key: 'emp_name', direction: 'asc' });

  //  หน้าปัจจุบันของเพจจิเนชัน
  const [currentPage, setCurrentPage] = useState(1);

  //  ตัวจิ้มให้ useEffect รีเฟตช์ (ใช้ตอนลบแถวแล้วจะรีโหลด)
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // เอาไว้พาไปหน้า add
  const navigate = useNavigate();

  // 1) โหลดรายการตำแหน่ง (ครั้งเดียว)
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const response = await api.get('/positions');
        setPositions(response.data);
      } catch (err) {
        console.error("Failed to fetch positions", err);
      }
    };
    fetchPositions();
  }, []);

  // 2) โหลดรายชื่อพนักงานทุกครั้งที่ตัวกรอง/การเรียง/หน้า เปลี่ยน
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isSorting) setLoading(true);   // ถ้าเป็นกด sort ไม่ต้องโชว์โหลดใหญ่
      setError(null);
      try {
        // สร้าง query ส่งให้ backend
        const params = {
          ...filters,
          sort: sortConfig.key,
          order: sortConfig.direction,
          page: currentPage,
          limit: 15
        };
        const response = await api.get('/employees', { params });
        // เก็บผลลัพธ์
        setEmployees(response.data.data || []);
        setMeta(response.data.meta || {});
      } catch (err) {
        console.error('Failed to fetch employees:', err);
        setError('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน');
      } finally {
        setLoading(false);
        setIsSorting(false);
      }
    };
    fetchEmployees();
  }, [filters, sortConfig, currentPage, refetchTrigger, isSorting]);

  // เปลี่ยนค่าฟิลเตอร์ dropdown (ตำแหน่ง/สถานะ)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentPage(1); // รีเซ็ตไปหน้าแรกเมื่อฟิลเตอร์เปลี่ยน
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // submit การค้นหา: ย้ายค่าจาก searchInput → filters.search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  // ล้างคำค้น
  const clearSearch = () => {
    setCurrentPage(1);
    setSearchInput('');
    setFilters(prev => ({ ...prev, search: '' }));
  };

  //  เปลี่ยนการ sort: คลิกคอลัมน์ซ้ำสลับ asc/desc
  const handleSort = (key) => {
    setCurrentPage(1);
    setIsSorting(true);
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // เปลี่ยนหน้าเพจจิเนชัน (กันออกนอกขอบ)
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
      setCurrentPage(newPage);
    }
  };

  // ลบพนักงาน → เรียก DELETE แล้วรีเฟตช์รายการ
  const handleDelete = async (empId, empName) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่ต้องการลบพนักงาน ${empName}?`)) {
      try {
        await api.delete(`/employees/${empId}`);
        alert('ลบพนักงานสำเร็จ');
        // ถ้าลบแถวสุดท้ายของหน้าและไม่ใช่หน้าแรก → ถอยหน้ากลับ
        if (employees.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          setRefetchTrigger(t => t + 1); // กระตุ้นให้ useEffect รีโหลด
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบพนักงาน';
        alert(errorMessage);
      }
    }
  };

  // ระหว่างโหลด
  if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>;

  return (
    <div>
      {/* หัวข้อหน้า + ปุ่มเพิ่มพนักงาน */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-dark mb-0">พนักงาน</h4>
        <button
          onClick={() => navigate('/employees/add')}
          className="btn btn-outline-secondary"
          style={{ fontSize: '1rem' }}
        >
          <FontAwesomeIcon icon={faPlus} className="me-2" /> บันทึกข้อมูลพนักงานใหม่
        </button>
      </div>

      {/* การ์ดครอบ section ทั้งหมด */}
      <div className="card shadow-sm p-4 mt-4">

        {/* แสดง error ด้านบน ถ้ามี */}
        {error && (
          <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
          </div>
        )}

        {/* ส่วนตัวกรอง (ค้นหา/ตำแหน่ง/สถานะ) */}
        <div className="row g-2 mb-1">
          {/* กล่องค้นหา */}
          <div className="col-md-7">
            <form onSubmit={handleSearchSubmit} className="mb-3 search-form">
              <div className="input-group w-50">
                <input
                  type="text"
                  className="form-control"
                  placeholder="ค้นหาชื่อพนักงานหรือตำแหน่ง..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  style={{ fontSize: '1rem' }}
                />
                <button className="btn btn-outline-secondary" type="submit" style={{ fontSize: '1rem' }}>
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                </button>
                {/* ปุ่มล้างการค้นหา (แสดงเมื่อมี filters.search) */}
                {filters.search && (
                  <button
                    onClick={clearSearch}
                    className="btn btn-outline-danger"
                    type="button"
                    title="ล้างการค้นหา"
                    style={{ fontSize: '1rem' }}
                  >
                    <FontAwesomeIcon icon={faTimes} className="me-1" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* เลือกตำแหน่ง */}
          <div className="col-md-3">
            <div className="input-group">
              <label className="input-group-text bg-light text-dark" style={{ fontSize: '1rem' }}>
                ตำแหน่ง
              </label>
              <select
                className="form-select"
                name="jobpos_id"
                value={filters.jobpos_id}
                onChange={handleFilterChange}
                style={{ fontSize: '1rem' }}
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

          {/* เลือกสถานะ */}
          <div className="col-md-2">
            <div className="input-group">
              <label className="input-group-text bg-light text-dark" style={{ fontSize: '1rem' }}>
                สถานะ
              </label>
              <select
                className="form-select"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={{ fontSize: '1rem' }}
              >
                <option value="active">ทำงานอยู่</option>
                <option value="resigned">ลาออกแล้ว</option>
                <option value="">ทั้งหมด</option>
              </select>
            </div>
          </div>
        </div>

        {/* แจ้งสรุปผลการค้นหา */}
        {filters.search && !error && (
          <div className="alert alert-info py-2" style={{ fontSize: '0.95rem' }}>
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
          </div>
        )}

        {/* ตารางรายชื่อ + เพจจิเนชัน */}
        {!error && (
          <div>
            <div className="table-responsive">
              <table className="table table-hover table-bordered text-center align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="profile" style={{ fontSize: '1.05rem', color: '#333' }}>โปรไฟล์</th>

                    {/* คอลัมน์ที่ sort ได้: ชื่อ - สกุล */}
                    <th
                      onClick={() => handleSort('emp_name')}
                      style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}
                    >
                      ชื่อ - สกุล {sortConfig.key === 'emp_name' && (
                        <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />
                      )}
                    </th>

                    {/* คอลัมน์ที่ sort ได้: ตำแหน่ง (ที่ backend ใช้ key jobpos_id) */}
                    <th
                      onClick={() => handleSort('jobpos_id')}
                      style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}
                    >
                      ตำแหน่ง {sortConfig.key === 'jobpos_id' && (
                        <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />
                      )}
                    </th>

                    <th style={{ fontSize: '1.05rem', color: '#333' }}>จัดการ</th>
                  </tr>
                </thead>

                <tbody>
                  {/* มีข้อมูล → map แถว */}
                  {employees.length > 0 ? employees.map((employee) => (
                    <tr key={employee.emp_id}>
                      {/* รูปโปรไฟล์ (มีรูปเดิมแสดงจาก uploads, ไม่มีก็รูป default) */}
                      <td className="profile-cell">
                        <img
                          src={employee.emp_pic ? `${BASE_URL_UPLOAD}${employee.emp_pic}` : '/images/profile.jpg'}
                          alt={employee.emp_name}
                          className="profile-image"
                        />
                      </td>

                      {/* ชื่อ-สกุล / ชื่อตำแหน่ง */}
                      <td style={{ fontSize: '0.98rem' }}>{employee.emp_name}</td>
                      <td style={{ fontSize: '0.98rem' }}>{employee.jobpos_name}</td>

                      {/* ปุ่มจัดการ: ดู / แก้ไข / ลบ */}
                      <td style={{ minWidth: '220px' }}>
                        <Link
                          to={`/employees/view/${employee.emp_id}`}
                          className="btn btn-info btn-sm me-2 text-white"
                          title="ดูรายละเอียด"
                          style={{ fontSize: '0.95rem' }}
                        >
                          <FontAwesomeIcon icon={faEye} className='me-1' /> ดู
                        </Link>

                        <Link
                          to={`/employees/edit/${employee.emp_id}`}
                          className="btn btn-primary btn-sm me-2"
                          title="แก้ไข"
                          style={{ fontSize: '0.95rem' }}
                        >
                          <FontAwesomeIcon icon={faEdit} className='me-1' /> แก้ไข
                        </Link>

                        <button
                          onClick={() => handleDelete(employee.emp_id, employee.emp_name)}
                          className="btn btn-danger btn-sm"
                          title="ลบ"
                          style={{ fontSize: '0.95rem' }}
                        >
                          <FontAwesomeIcon icon={faTrash} className='me-1' /> ลบ
                        </button>
                      </td>
                    </tr>
                  )) : (
                    // ไม่มีข้อมูล → แสดง state ว่าง
                    <tr>
                      <td colSpan="4" className="text-muted py-5 text-center">
                        <div className="d-flex flex-column align-items-center">
                          <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                          <span className="mb-0 text-muted" style={{ fontSize: '1.05rem' }}>
                            {filters.search || filters.jobpos_id || filters.status
                              ? 'ไม่พบข้อมูลตามเงื่อนไข'
                              : 'ไม่มีข้อมูลพนักงาน'}
                          </span>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeListPage;
