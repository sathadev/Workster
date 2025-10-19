// หน้า "รายการประกาศรับสมัครงาน" สำหรับ HR/Admin
// โครงนี้ครอบคลุม: ดึงรายการ, ค้นหา/กรอง, เรียงลำดับ, เพจจิ้ง, ลบ, ตรวจสิทธิ์เข้าถึง

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // axios instance รวม baseURL/headers
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus, faEye, faEdit, faTrash, faSearch, faTimes,
    faInbox, faInfoCircle, faSortUp, faSortDown, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext'; // ดึง user เพื่อเช็ค role/สิทธิ์

function JobPostingListPage() {
    const { user } = useAuth();         // ข้อมูลผู้ใช้ปัจจุบัน (เอาไปเช็คสิทธิ์)
    const navigate = useNavigate();

    // State หลัก
    const [jobPostings, setJobPostings] = useState([]); // รายการประกาศงานที่จะแสดงในตาราง
    const [meta, setMeta] = useState({});               // ข้อมูลแบ่งหน้า
    const [loading, setLoading] = useState(true);       // สถานะกำลังโหลด
    const [error, setError] = useState(null);           // ข้อผิดพลาดหน้า list

    // ค้นหา/กรอง/เรียง
    const [searchInput, setSearchInput] = useState(''); // ค่าที่พิมพ์ในกล่องค้นหา (ยังไม่ยิง API จนกดค้นหา)
    const [filters, setFilters] = useState({
        search: '',     // ข้อความค้นหา ที่ถูก "ยืนยัน" แล้ว (กดปุ่มค้นหา)
        status: '',     // กรองสถานะ:(ทั้งหมด)
        jobpos_id: ''   // กรองตามตำแหน่งงาน (id ของตำแหน่งในระบบ)
    });
    const [sortConfig, setSortConfig] = useState({      // คีย์เรียงและทิศทาง
        key: 'posted_at',                                // ค่าเริ่มต้นเรียงตามวันที่ลงประกาศ
        direction: 'desc'
    });
    const [currentPage, setCurrentPage] = useState(1);  // หน้าปัจจุบันของเพจจิ้ง
    const [positions, setPositions] = useState([]);     // รายการ "ตำแหน่งในระบบ" สำหรับ dropdown filter

    // ดึงรายการ "ตำแหน่งงาน" เพื่อใช้เป็นตัวกรอง 
    useEffect(() => {
        const fetchPositions = async () => {
            try {
                const response = await api.get('/positions'); // GET รายการตำแหน่ง
                setPositions(response.data);
            } catch (err) {
                console.error("Failed to fetch positions for job postings:", err);
            }
        };
        fetchPositions();
    }, []);

    //  ฟังก์ชันดึง "รายการประกาศงาน" ตามตัวกรอง/เรียง/หน้า 
    const fetchJobPostings = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // เช็คสิทธิ์ก่อน ถ้าไม่ใช่ role ที่กำหนด => หยุดและแจ้งเตือน
            if (!user || ![1, 2, 3].includes(user.jobpos_id)) {
                setError('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
                setLoading(false);
                return;
            }

            const params = {
                ...filters,                 // search, status, jobpos_id
                sort: sortConfig.key,       // คอลัมน์ที่จะ sort
                order: sortConfig.direction,// asc/desc
                page: currentPage,          // หน้าที่ต้องการ
                limit: 10,                  // จำนวนต่อหน้า
            };

            const response = await api.get('/job-postings', { params }); // GET /job-postings
            setJobPostings(response.data.data || []); //  ใส่รายการลงตาราง
            setMeta(response.data.meta || {});        // เก็บข้อมูลแบ่งหน้า
        } catch (err) {
            console.error("Failed to fetch job postings:", err.response?.data || err.message);
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลประกาศรับสมัครงาน");
        } finally {
            setLoading(false);
        }
    }, [filters, sortConfig, currentPage, user]);

    // เรียกดึงข้อมูลทุกครั้งเมื่อเงื่อนไขที่เกี่ยวข้องเปลี่ยน
    useEffect(() => {
        fetchJobPostings();
    }, [fetchJobPostings]);

    // เปลี่ยนฟิลเตอร์/ค้นหา/ล้าง/เรียง/เพจจิ้ง 
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setCurrentPage(1);                          //  รีเซ็ตกลับหน้า 1 เมื่อเปลี่ยนตัวกรอง
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearchInputChange = (e) => setSearchInput(e.target.value); // พิมพ์ข้อความค้นหา (ยังไม่ยิง)

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: searchInput })); // กดค้นหา -> ยืนยันค่าไป filters.search
    };

    const clearSearch = () => {
        setSearchInput('');
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, search: '' }));          // ล้างค้นหา -> ยิง API ใหม่
    };

    const handleSort = (key) => {
        // กดหัวตารางเพื่อสลับ asc/desc ของคอลัมน์นั้น
        setCurrentPage(1);
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const handlePageChange = (newPage) => {
        // ป้องกันออกนอกช่วงหน้า
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };

    // ลบประกาศ
    const handleDelete = async (id, title) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะลบประกาศ "${title}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
            return;
        }
        try {
            await api.delete(`/job-postings/${id}`);   // DELETE /job-postings/:id
            alert('ลบประกาศรับสมัครงานสำเร็จ!');
            fetchJobPostings();                        // รีเฟรชรายการหลังลบ
        } catch (err) {
            console.error("Error deleting job posting:", err.response?.data || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบประกาศ');
        }
    };

    // ฟอร์แมตวันที่ให้เป็นแบบไทย
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // การ์ดกันเข้า: อนุญาตเฉพาะ jobpos_id = 1/2/3 
    if (!user || ![1, 2, 3].includes(user.jobpos_id)) {
        return (
            <Alert variant="danger" className="mt-5 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </Alert>
        );
    }

    // สถานะกำลังโหลด
    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</Alert>;

    return (
        <div>
            {/* หัวข้อหน้า + ปุ่ม "สร้างประกาศใหม่" */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">ประกาศรับสมัครงาน</h4>
                <Button variant="outline-primary" onClick={() => navigate('/job-postings/add')}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> สร้างประกาศใหม่
                </Button>
            </div>

            {/* ครอบทุกอย่างด้วยการ์ด เพื่อความเป็นระเบียบ */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">

                    {/* ค้นหา + ฟิลเตอร์สถานะ/ตำแหน่ง */}
                    <div className="row g-2 mb-3">
                        <div className="col-md-4">
                            <form onSubmit={handleSearchSubmit} className="search-form">
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="ค้นหาชื่อตำแหน่ง หรือบริษัท..."
                                        value={searchInput}
                                        onChange={handleSearchInputChange}
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

                        {/* กรองตามสถานะ */}
                        <div className="col-md-3">
                            <div className="input-group">
                                <label className="input-group-text">สถานะ</label>
                                <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                                    <option value="">ทั้งหมด</option>
                                    <option value="active">เปิดรับสมัคร</option>
                                    <option value="closed">ปิดรับสมัคร</option>
                                    <option value="draft">ฉบับร่าง</option>
                                </Form.Select>
                            </div>
                        </div>

                        {/* กรองตาม "ตำแหน่งในระบบ" */}
                        <div className="col-md-3">
                            <div className="input-group">
                                <label className="input-group-text">ตำแหน่ง</label>
                                <Form.Select name="jobpos_id" value={filters.jobpos_id} onChange={handleFilterChange}>
                                    <option value="">ทุกตำแหน่ง</option>
                                    {positions.map(pos => (
                                        <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                                    ))}
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

                    {/* ตารางรายการประกาศ */}
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    {/* กดหัวคอลัมน์เพื่อเรียงข้อมูล */}
                                    <th onClick={() => handleSort('job_title')} style={{ cursor: 'pointer' }}>
                                        ตำแหน่งที่ประกาศ {sortConfig.key === 'job_title' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('jobpos_id')} style={{ cursor: 'pointer' }}>
                                        ตำแหน่งในระบบ {sortConfig.key === 'jobpos_id' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th>ช่วงเงินเดือน</th>
                                    <th onClick={() => handleSort('job_status')} style={{ cursor: 'pointer' }}>
                                        สถานะ {sortConfig.key === 'job_status' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th onClick={() => handleSort('posted_at')} style={{ cursor: 'pointer' }}>
                                        วันที่ประกาศ {sortConfig.key === 'posted_at' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                                    </th>
                                    <th>ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobPostings.length > 0 ? jobPostings.map(post => (
                                    <tr key={post.job_posting_id}>
                                        <td>{post.job_title}</td>
                                        <td>{post.jobpos_name || '-'}</td>
                                        <td>{post.salary_min?.toLocaleString()} - {post.salary_max?.toLocaleString()} บาท</td>
                                        <td>
                                            {/* แสดง badge สถานะให้อ่านง่าย */}
                                            <span className={`badge ${post.job_status === 'active' ? 'bg-success' : post.job_status === 'closed' ? 'bg-danger' : 'bg-secondary'}`}>
                                                {post.job_status === 'active' ? 'เปิดรับ' : post.job_status === 'closed' ? 'ปิดรับ' : 'ฉบับร่าง'}
                                            </span>
                                        </td>
                                        <td>{formatDate(post.posted_at)}</td>
                                        <td style={{ minWidth: '180px' }}>
                                            {/* ดูรายละเอียด / แก้ไข / ลบ */}
                                            <Link to={`/job-postings/view/${post.job_posting_id}`} className="btn btn-info btn-sm me-2 text-white" title="ดูรายละเอียด">
                                                <FontAwesomeIcon icon={faEye} /> ดู
                                            </Link>
                                            <Link to={`/job-postings/edit/${post.job_posting_id}`} className="btn btn-primary btn-sm me-2" title="แก้ไข">
                                                <FontAwesomeIcon icon={faEdit} /> แก้ไข
                                            </Link>
                                            <Button variant="danger" size="sm" onClick={() => handleDelete(post.job_posting_id, post.job_title)} title="ลบ">
                                                <FontAwesomeIcon icon={faTrash} /> ลบ
                                            </Button>
                                        </td>
                                    </tr>
                                )) : (
                                    // กรณีไม่มีข้อมูลให้แสดง placeholder สวย ๆ
                                    <tr>
                                        <td colSpan="6" className="text-center text-muted p-4">
                                            <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                                            <h4>ไม่พบข้อมูลประกาศรับสมัครงาน</h4>
                                            <p>{filters.search || filters.status || filters.jobpos_id ? 'ไม่พบข้อมูลตามเงื่อนไขที่เลือก' : 'ยังไม่มีประกาศรับสมัครงาน'}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* เพจจิ้ง: ก่อนหน้า/ถัดไป + แสดงรวมจำนวนรายการ */}
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
        </div>
    );
}

export default JobPostingListPage;
