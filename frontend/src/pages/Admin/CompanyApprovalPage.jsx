// frontend/src/pages/Admin/CompanyApprovalPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faSearch, faTimes, faInbox, faInfoCircle, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons'; 
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge'; 
import { useAuth } from '../../context/AuthContext'; 

function CompanyApprovalPage() {
    // user ใช้ตรวจสิทธิ์ว่าเป็น Super Admin หรือไม่
    const { user } = useAuth(); 
    // state หลัก
    const [companies, setCompanies] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // state สำหรับค้นหา/กรอง/เรียง/แบ่งหน้า
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        status: 'pending', 
    });
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);
    // ฟังก์ชันดึงข้อมูลบริษัท (ผูก dependency ให้ถูก → ใช้ useCallback กัน re-create เกินจำเป็น)
    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // กันไว้ก่อนฝั่ง UI (ฝั่ง API ก็ควรตรวจสิทธิ์ด้วย)
            if (!user || !user.isSuperAdmin) { // ตรวจสอบสิทธิ์
                setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                setLoading(false);
                return;
            }
            // สร้าง query params สำหรับ backend
            const params = {
                ...filters,
                sort: sortConfig.key,
                order: sortConfig.direction,
                page: currentPage,
                limit: 10, 
            };

            // API
            const response = await api.get('/admin/companies', { params }); // ดึงบริษัททั้งหมด
            setCompanies(response.data.data || []);
            setMeta(response.data.meta || {});
        } catch (err) {
            console.error("Failed to fetch companies:", err.response?.data || err.message);
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
        } finally {
            setLoading(false);
        }
    }, [filters, sortConfig, currentPage, user]);  // ผูกกับ state ที่มีผลต่อการดึงข้อมูล
    // โหลดข้อมูลทุกครั้งที่ dependency ของ fetchCompanies เปลี่ยน
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // อนุมัติ/ปฏิเสธสถานะบริษัท
    const handleUpdateStatus = async (companyId, newStatus, companyName) => {
        // กล่องยืนยันการเปลี่ยนสถานะ
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะ "${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}" บริษัท ${companyName}?`)) {
            return;
        }
        try {
            await api.patch(`/admin/companies/${companyId}/status`, { status: newStatus });
            alert(`อัปเดตสถานะบริษัท ${companyName} เป็น "${newStatus}" สำเร็จ!`);
            fetchCompanies(); // รีเฟรชตารางหลังเปลี่ยนสถานะสำเร็จ
        } catch (err) {
            console.error("Error updating company status:", err.response?.data || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        }
    };

    // เปลี่ยนตัวกรอง (สถานะ,รีเซ็ตไปหน้า 1)
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // จัดการช่องค้นหา (UI)
    const handleSearchInputChange = (e) => setSearchInput(e.target.value);

    // กดค้นหา → ย้ายค่าจาก searchInput ไป filters.search (ของจริงที่จะส่ง API)
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: searchInput }));
    };

    // ล้างคำค้นหา
    const clearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: '' }));
    };

    // สลับการเรียง
    const handleSort = (key) => {
        setCurrentPage(1);
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    // การเปลี่ยนหน้า (ป้องกันออกนอกช่วง)
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    // แปลงวันที่ให้เป็นรูปแบบไทยอ่านง่าย
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // ตรวจสอบสิทธิ์ก่อนแสดงผล
    if (!user || !user.isSuperAdmin) {
        return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faTimesCircle} className="me-2"/>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Alert>;
    }

    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faInfoCircle} className="me-2"/>{error}</Alert>;
    
    // ส่วนแสดงผลหลัก
    return (
        <div>
            <h4 className="fw-bold mb-3">จัดการบริษัท</h4>
            <p>หน้าหลัก / จัดการบริษัท</p>

            <div className="card shadow-sm p-4">
                {/* การค้นหา + กรองสถานะ */}
                <div className="row g-2 mb-3 align-items-end">
                    <div className="col-md-5">
                        <form onSubmit={handleSearchSubmit}>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="ค้นหาชื่อบริษัท..."
                                    value={searchInput}
                                    onChange={handleSearchInputChange}
                                />
                                <button className="btn btn-outline-secondary" type="submit">
                                    <FontAwesomeIcon icon={faSearch} />
                                </button>
                                {/* ปุ่มล้างคำค้นจะแสดงต่อเมื่อมี filters.search */}
                                {filters.search && (
                                    <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา">
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* กรองตามสถานะ */}
                    <div className="col-md-4 offset-md-3">
                        <div className="input-group">
                            <label className="input-group-text">สถานะ</label>
                            <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                <option value="pending">รอดำเนินการ</option>
                                <option value="approved">อนุมัติแล้ว</option>
                                <option value="rejected">ปฏิเสธแล้ว</option>
                                <option value="">ทั้งหมด</option>
                            </Form.Select>
                        </div>
                    </div>
                </div>

                {/* แถบแจ้งผลการค้นหา */}
                {filters.search && !error && (
                    <div className="alert alert-info py-2">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                    </div>
                )}

                {/* ตารางข้อมูลบริษัท + การเรียงคอลัมน์ */}
                <div className="table-responsive">
                    <table className="table table-hover table-bordered text-center align-middle">
                        <thead className="table-light">
                            <tr>
                                <th onClick={() => handleSort('company_name')} style={{ cursor: 'pointer' }}>
                                    ชื่อบริษัท {sortConfig.key === 'company_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                </th>
                                <th>อีเมล</th>
                                <th>เบอร์โทร</th>
                                <th onClick={() => handleSort('created_at')} style={{ cursor: 'pointer' }}>
                                    วันที่สมัคร {sortConfig.key === 'created_at' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                </th>
                                <th onClick={() => handleSort('company_status')} style={{ cursor: 'pointer' }}>
                                    สถานะ {sortConfig.key === 'company_status' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                </th>
                                <th>ดำเนินการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.length > 0 ? companies.map(company => (
                                <tr key={company.company_id}>
                                    <td>
                                        {/* คลิกแล้วไปหน้ารายละเอียดบริษัท */}
                                        <Link to={`/admin/companies/${company.company_id}`} className="fw-bold text-primary text-decoration-underline">
                                            {company.company_name}
                                        </Link>
                                    </td>
                                    <td>{company.company_email || '-'}</td>
                                    <td>{company.company_phone || '-'}</td>
                                    <td>{formatDate(company.created_at)}</td>
                                    <td><StatusBadge status={company.company_status} /></td>
                                    <td style={{ minWidth: '200px' }}>
                                        {/* แสดงปุ่มอนุมัติ/ปฏิเสธเฉพาะรายการที่กำลัง pending */}
                                        {company.company_status === 'pending' ? (
                                            <>
                                                <Button variant="success" size="sm" className="me-2" onClick={() => handleUpdateStatus(company.company_id, 'approved', company.company_name)}>
                                                    <FontAwesomeIcon icon={faCheckCircle} /> อนุมัติ
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(company.company_id, 'rejected', company.company.name)}>
                                                    <FontAwesomeIcon icon={faTimesCircle} /> ปฏิเสธ
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="text-muted">ไม่มีการดำเนินการ</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                // กรณีไม่พบข้อมูล
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-5">
                                        <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                                        <h4>ไม่พบข้อมูลบริษัท</h4>
                                        <p>{filters.status === 'pending' ? 'ยังไม่มีบริษัทที่รอการอนุมัติ' : 'ไม่พบข้อมูลบริษัทตามเงื่อนไขที่เลือก'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ตัวควบคุมการแบ่งหน้า */}
                {meta.totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="text-muted">หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)</span>
                        <div className="btn-group">
                            <Button variant="outline-secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                                ก่อนหน้า
                            </Button>
                            <Button variant="outline-secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={!meta.totalPages || currentPage >= meta.totalPages}>
                                ถัดไป
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CompanyApprovalPage;