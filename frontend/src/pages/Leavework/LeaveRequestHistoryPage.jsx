// frontend/src/pages/Leavework/LeaveRequestHistoryPage.jsx
// หน้า "ประวัติคำขอลา" (เฉพาะรายการที่อนุมัติ/ปฏิเสธ) พร้อมค้นหา กรอง เรียงลำดับ และแบ่งหน้า

import { useState, useEffect } from 'react';
import api from '../../api/axios'; // instance ของ axios ที่ตั้งค่า baseURL/headers แล้ว
import StatusBadge from '../../components/StatusBadge'; // คอมโพเนนต์แสดง badge สถานะ (approved/rejected/...)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch, faInbox, faTimes, faInfoCircle,
    faSort, faSortUp, faSortDown, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'react-bootstrap';

function LeaveRequestHistoryPage() {
    const navigate = useNavigate();

    // State หลักของหน้า
    const [leaveRequests, setLeaveRequests] = useState([]); // รายการคำขอลา (ข้อมูลตาราง)
    const [loading, setLoading] = useState(true);           // สถานะกำลังโหลด
    const [error, setError] = useState(null);               // ข้อผิดพลาดหากโหลดไม่สำเร็จ

    // State ค้นหา/กรอง/เรียง
    const [searchInput, setSearchInput] = useState('');     // ค่าที่พิมพ์ในช่องค้นหา (รอกด submit)
    const [filters, setFilters] = useState({
        search: '',                 // คำค้นที่ "ยืนยันแล้ว" สำหรับยิง API
        leaveworktype_id: '',       // กรองตามประเภทการลา (id)
        status: ['approved', 'rejected'] // บังคับให้ดึงเฉพาะ "อนุมัติ/ปฏิเสธ" เพื่อเป็นประวัติ
    });
    const [sortConfig, setSortConfig] = useState({          //  คีย์และทิศทางการเรียง
        key: 'leavework_daterequest',
        direction: 'desc'
    });
    const [currentPage, setCurrentPage] = useState(1);      //  หน้าปัจจุบัน
    const [meta, setMeta] = useState({});                   // ข้อมูลแบ่งหน้า (totalItems/totalPages/...)
    const [leaveTypes, setLeaveTypes] = useState([]);       // ประเภทการลา สำหรับ dropdown

    // ดึง "ประเภทการลา" เพื่อทำตัวกรอง 
    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                const response = await api.get('/leave-types'); //  GET /leave-types
                setLeaveTypes(response.data);
            } catch (err) {
                console.error("Failed to fetch leave types for filter:", err);
            }
        };
        fetchLeaveTypes();
    }, []);

    // ดึง "รายการประวัติคำขอลา" เมื่อ filters/sort/page เปลี่ยน 
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // รวมพารามิเตอร์สำหรับ backend: กรอง/เรียง/แบ่งหน้า
                const params = {
                    ...filters,
                    sort: sortConfig.key,
                    order: sortConfig.direction,
                    page: currentPage,
                    limit: 10
                };
                const response = await api.get('/leave-requests', { params }); // GET /leave-requests
                setLeaveRequests(response.data.data || []); // ใส่ข้อมูลตาราง
                setMeta(response.data.meta || {});          // อัปเดตข้อมูลแบ่งหน้า
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters, sortConfig, currentPage]);

    // ช่วยฟอร์แมตวันที่เป็นรูปแบบไทย 
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Handlers: ค้นหา/ล้าง/กรอง/เรียง/เพจจิ้ง
    const handleSearchInputChange = (e) => setSearchInput(e.target.value); // พิมพ์ในช่องค้นหา

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);                                       // เมื่อค้นหาใหม่ ให้กลับหน้า 1
        setFilters(prev => ({ ...prev, search: searchInput }));  // ยืนยันคำค้นลง filters แล้วจึงยิง API
    };

    const clearSearch = () => {
        setSearchInput('');                                      // ล้างอินพุต
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: '' }));           // ล้าง filters.search แล้วเรียกใหม่
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1);
        setFilters(prevFilters => ({ ...prevFilters, [name]: value })); // เปลี่ยนประเภทการลา -> รีเฟรช
    };

    const handleSort = (key) => {
        // กดหัวตารางเพื่อสลับ asc/desc
        setCurrentPage(1);
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handlePageChange = (newPage) => {
        // ป้องกันกดออกนอกช่วงหน้า
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    // Loading / Error 
    if (loading) return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลด...</div>;
    if (error) return <div className="mt-5 text-center"><Alert variant="danger" style={{ fontSize: '0.95rem' }}>{error}</Alert></div>;

    return (
        <div>
            {/* หัวข้อหน้า + ปุ่มย้อนกลับ */}
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ประวัติคำขอลา</h4>
            <div className="d-flex justify-content-start align-items-center mb-3">
                <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
                </Button>
            </div>

            {/* ครอบด้วยการ์ดเพื่อความเรียบร้อย */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">

                    {/* แถวค้นหา + กรองประเภทการลา*/}
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
                                        style={{ fontSize: '1rem' }}
                                    />
                                    <button className="btn btn-outline-secondary" type="submit" style={{ fontSize: '1rem' }}>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </button>
                                    {filters.search && (
                                        <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา" style={{ fontSize: '1rem' }}>
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Dropdown ประเภทการลา */}
                        <div className="col-md-6">
                            <div className="input-group">
                                <label className="input-group-text bg-light text-dark" style={{ fontSize: '1rem' }}>ประเภทการลา</label>
                                <select
                                    className="form-select"
                                    name="leaveworktype_id"
                                    value={filters.leaveworktype_id}
                                    onChange={handleFilterChange}
                                    style={{ fontSize: '1rem' }}
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

                    {/* แจ้งผลการค้นหาเมื่อมีคำค้น */}
                    {filters.search && !error && (
                        <div className="alert alert-info py-2" style={{ fontSize: '0.95rem' }}>
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                            ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                        </div>
                    )}

                    {/* ตารางประวัติคำขอลา*/}
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    {/* หัวคอลัมน์กดเรียงได้ */}
                                    <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('leaveworktype_id')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        ประเภทการลา {sortConfig.key === 'leaveworktype_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th style={{ fontSize: '1.05rem', color: '#333' }}>หมายเหตุ</th>
                                    <th onClick={() => handleSort('leavework_daterequest')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        วันที่ลา {sortConfig.key === 'leavework_daterequest' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('leavework_status')} style={{ cursor: 'pointer', fontSize: '1.05rem', color: '#333' }}>
                                        สถานะ {sortConfig.key === 'leavework_status' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveRequests.length > 0 ? leaveRequests.map((leave) => (
                                    <tr key={leave.leavework_id}>
                                        <td style={{ fontSize: '0.98rem' }}>{leave.emp_name}</td>
                                        <td style={{ fontSize: '0.98rem' }}>{leave.leaveworktype_name}</td>
                                        <td style={{ fontSize: '0.98rem' }}>{leave.leavework_description}</td>
                                        {/* แสดงช่วงวันที่ลา: เริ่ม - สิ้นสุด */}
                                        <td style={{ fontSize: '0.98rem' }}>{formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}</td>
                                        {/* แสดงสถานะเป็น badge สวยๆ */}
                                        <td><StatusBadge status={leave.leavework_status} /></td>
                                    </tr>
                                )) : (
                                    // กรณีไม่มีข้อมูล ให้ขึ้น placeholder ชัดเจน
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted p-4">
                                            <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block" />
                                            <span style={{ fontSize: '1.05rem' }}>{filters.search || filters.leaveworktype_id ? 'ไม่พบข้อมูลคำขอลาตามเงื่อนไข' : 'ไม่มีประวัติคำขอลา'}</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* เพจจิ้ง: ก่อนหน้า/ถัดไป + สรุปจำนวนรายการ */}
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
            </div>
        </div>
    );
}

export default LeaveRequestHistoryPage;
