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
    const { user } = useAuth(); 
    const [companies, setCompanies] = useState([]);
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState({
        search: '',
        status: 'pending', 
    });
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
    const [currentPage, setCurrentPage] = useState(1);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (!user || !user.isSuperAdmin) { // ตรวจสอบสิทธิ์
                setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                setLoading(false);
                return;
            }

            const params = {
                ...filters,
                sort: sortConfig.key,
                order: sortConfig.direction,
                page: currentPage,
                limit: 10, 
            };
            const response = await api.get('/admin/companies', { params }); // ดึงบริษัททั้งหมด
            setCompanies(response.data.data || []);
            setMeta(response.data.meta || {});
        } catch (err) {
            console.error("Failed to fetch companies:", err.response?.data || err.message);
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลบริษัท");
        } finally {
            setLoading(false);
        }
    }, [filters, sortConfig, currentPage, user]); // เพิ่ม user ใน dependency array

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleUpdateStatus = async (companyId, newStatus, companyName) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะ "${newStatus === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}" บริษัท ${companyName}?`)) {
            return;
        }
        try {
            await api.patch(`/admin/companies/${companyId}/status`, { status: newStatus });
            alert(`อัปเดตสถานะบริษัท ${companyName} เป็น "${newStatus}" สำเร็จ!`);
            fetchCompanies(); 
        } catch (err) {
            console.error("Error updating company status:", err.response?.data || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchInputChange = (e) => setSearchInput(e.target.value);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: searchInput }));
    };

    const clearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: '' }));
    };

    const handleSort = (key) => {
        setCurrentPage(1);
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

    return (
        <div>
            <h4 className="fw-bold mb-3">จัดการบริษัท</h4>
            <p>หน้าหลัก / จัดการบริษัท</p>

            <div className="card shadow-sm p-4">
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
                                {filters.search && (
                                    <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา">
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
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

                {filters.search && !error && (
                    <div className="alert alert-info py-2">
                        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                        ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                    </div>
                )}

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
                                        <Link to={`/admin/companies/${company.company_id}`} className="fw-bold text-primary text-decoration-underline">
                                            {company.company_name}
                                        </Link>
                                    </td>
                                    <td>{company.company_email || '-'}</td>
                                    <td>{company.company_phone || '-'}</td>
                                    <td>{formatDate(company.created_at)}</td>
                                    <td><StatusBadge status={company.company_status} /></td>
                                    <td style={{ minWidth: '200px' }}>
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