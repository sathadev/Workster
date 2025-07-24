// frontend/src/pages/Evaluations/EvaluationHistoryPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSearch, faInbox, faTimes, faInfoCircle, // ไอคอนสำหรับ Search และ Info
    faSort, faSortUp, faSortDown // ไอคอนสำหรับ Sort
} from '@fortawesome/free-solid-svg-icons'; 

function EvaluationHistoryPage() {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // --- State Management สำหรับ Search, Sort, Filter และ Pagination ---
    const [searchInput, setSearchInput] = useState(''); // ค่าที่ผู้ใช้พิมพ์ในช่องค้นหา
    const [filters, setFilters] = useState({ 
        search: '', // ค่าค้นหาที่ถูก apply แล้ว
        year: ''    // ปีที่เลือกสำหรับกรอง (ค่าว่าง = ทั้งหมด)
    });
    const [sortConfig, setSortConfig] = useState({ key: 'create_at', direction: 'desc' }); // Default sort by evaluation date (latest first)
    const [currentPage, setCurrentPage] = useState(1); // หน้าปัจจุบันสำหรับ Pagination
    const [meta, setMeta] = useState({}); // ข้อมูล Meta สำหรับ Pagination (totalItems, totalPages)

    // <--- แก้ไข: State สำหรับเก็บปีที่มีข้อมูลจริง
    const [actualAvailableYears, setActualAvailableYears] = useState([]); 
    // --->

    // Effect สำหรับดึงประวัติการประเมิน
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            setError(null); 
            try {
                // สร้าง Parameters สำหรับส่งไป Backend API
                const params = {
                    search: filters.search, // คำค้นหา
                    year: filters.year,     // ปีที่กรอง
                    sort: sortConfig.key,   // ฟิลด์สำหรับเรียงลำดับ
                    order: sortConfig.direction, // ทิศทางการเรียงลำดับ
                    page: currentPage,      // หน้าปัจจุบัน
                    limit: 10               // จำนวนรายการต่อหน้า (สามารถปรับได้)
                };
                // เรียก API เพื่อดึงข้อมูลประวัติการประเมิน (ต้องปรับ Backend ให้รองรับ params เหล่านี้)
                const response = await api.get('/evaluations', { params });
                setEvaluations(response.data.data || []); // สมมติว่า Backend คืนค่าเป็น { data: [], meta: {} }
                setMeta(response.data.meta || {});

                // <--- เพิ่ม: ดึงปีที่มีข้อมูลจริงหลังจากโหลด evaluations
                // ดึงปีที่ไม่ซ้ำกันจาก create_at ของข้อมูลที่ได้มา
                const yearsFromData = [...new Set(
                    (response.data.data || [])
                        .map(item => new Date(item.create_at).getFullYear())
                        .filter(year => !isNaN(year)) // กรองปีที่ไม่ใช่ตัวเลข
                )].sort((a, b) => b - a); // เรียงจากมากไปน้อย

                // เพิ่มตัวเลือก "ทั้งหมด" เข้าไป
                setActualAvailableYears(['', ...yearsFromData.map(String)]);
                // --->

            } catch (err) {
                console.error("Failed to fetch evaluation history:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [filters, sortConfig, currentPage]); // Dependencies: เมื่อ filters, sortConfig, currentPage เปลี่ยน จะดึงข้อมูลใหม่

    // Handler สำหรับการเปลี่ยนแปลงค่าในช่องค้นหา
    const handleSearchInputChange = (e) => {
        setSearchInput(e.target.value);
    };

    // Handler สำหรับการ Submit Form ค้นหา (กด Enter หรือคลิกปุ่มค้นหา)
    const handleSearchSubmit = (e) => {
        e.preventDefault(); 
        setCurrentPage(1); // เมื่อค้นหาใหม่ ให้กลับไปหน้าแรก
        setFilters(prev => ({ ...prev, search: searchInput })); // Apply คำค้นหา
    };

    // Handler สำหรับปุ่ม "ล้างการค้นหา"
    const clearSearch = () => {
        setSearchInput(''); // ล้างค่าในช่อง input
        setCurrentPage(1); // กลับไปหน้าแรก
        setFilters(prev => ({ ...prev, search: '' })); // ล้างคำค้นหาที่ถูก apply
    };

    // Handler สำหรับการเปลี่ยนแปลงค่าใน Dropdown ปีที่ประเมิน
    const handleYearChange = (e) => {
        setCurrentPage(1); // เมื่อ Filter ปีเปลี่ยน ให้กลับไปหน้าแรก
        setFilters(prev => ({ ...prev, year: e.target.value })); // Apply ปีที่เลือก
    };
    
    // Handler สำหรับการเรียงลำดับตาราง
    const handleSort = (key) => {
        setCurrentPage(1); // เมื่อ Sort ใหม่ ให้กลับไปหน้าแรก
        let direction = 'asc';
        // ถ้าคลิกที่คอลัมน์เดิม ให้สลับทิศทาง
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction }); // Apply การเรียงลำดับ
    };

    // Handler สำหรับการเปลี่ยนหน้า Pagination
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
            setCurrentPage(newPage);
        }
    };
    
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">ประวัติการประเมินผล</h4>
            <p><Link to="/evaluations">การประเมินผล</Link> / ประวัติการประเมิน</p>
            
            {/* --- Filter & Search Section --- */}
            <div className="row g-2 mb-3"> {/* เพิ่ม mb-3 เพื่อให้มีระยะห่างกับตาราง */}
                <div className="col-md-5"> {/* ช่องค้นหา */}
                    <form onSubmit={handleSearchSubmit} className="search-form">
                        <div className="input-group w-100"> {/* ใช้ w-100 เพื่อให้เต็มความกว้าง col */}
                            <input 
                                type="text" 
                                className="form-control" 
                                placeholder="ค้นหาตามชื่อพนักงาน..."
                                value={searchInput} 
                                onChange={handleSearchInputChange} 
                            />
                            <button className="btn btn-outline-secondary" type="submit">
                                <FontAwesomeIcon icon={faSearch} />
                            </button>
                            {filters.search && ( // แสดงปุ่มล้างเมื่อมีคำค้นหาที่ถูก apply แล้ว
                                <button onClick={clearSearch} className="btn btn-outline-danger" type="button" title="ล้างการค้นหา">
                                    <FontAwesomeIcon icon={faTimes} className="me-1" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                <div className="col-md-3 offset-md-4"> {/* Dropdown ปีที่ประเมิน (จัดไปทางขวา) */}
                    <div className="input-group">
                        <label className="input-group-text">ปีที่ประเมิน</label>
                        <select
                            className="form-select"
                            name="year"
                            value={filters.year}
                            onChange={handleYearChange}
                        >
                            {/* <--- แก้ไข: ใช้ actualAvailableYears แทน availableYears */}
                            {actualAvailableYears.map(year => (
                                <option key={year} value={year}>
                                    {year === '' ? 'ทั้งหมด' : year}
                                </option>
                            ))}
                            {/* ---> */}
                        </select>
                    </div>
                </div>
            </div>

            {filters.search && !error && (
                <div className="alert alert-info py-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                    ผลการค้นหา "<strong>{filters.search}</strong>" พบ {meta.totalItems || 0} รายการ
                </div>
            )}
            {/* ------------------------------------------------------------- */}

            {/* ตารางแสดงข้อมูล */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            {/* Header สำหรับ Sort วันที่ประเมิน */}
                            <th onClick={() => handleSort('create_at')} style={{ cursor: 'pointer' }}>
                                วันที่ประเมิน {sortConfig.key === 'create_at' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            {/* Header สำหรับ Sort ชื่อ-สกุล */}
                            <th onClick={() => handleSort('emp_name')} style={{ cursor: 'pointer' }}>
                                ชื่อ - สกุล {sortConfig.key === 'emp_name' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            {/* Header สำหรับ Sort คะแนนรวม */}
                            <th onClick={() => handleSort('evaluatework_totalscore')} style={{ cursor: 'pointer' }}>
                                คะแนนรวม {sortConfig.key === 'evaluatework_totalscore' && <FontAwesomeIcon icon={sortConfig.direction === 'asc' ? faSortUp : faSortDown} />}
                            </th>
                            <th>การประเมินผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evaluations.length > 0 ? evaluations.map(evaluation => (
                            <tr key={evaluation.evaluatework_id}>
                                <td>{formatDate(evaluation.create_at)}</td>
                                <td>{evaluation.emp_name}</td>
                                <td>{evaluation.evaluatework_totalscore}</td>
                                <td>
                                    <Link to={`/evaluations/result/${evaluation.evaluatework_id}`} className="btn btn-primary rounded-pill px-3">
                                        ผลการประเมิน
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted p-4">
                                    <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                    {filters.search || filters.year ? `ไม่พบข้อมูลตามเงื่อนไข` : 'ไม่พบข้อมูล'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Pagination Section --- */}
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
            {/* ------------------------------------------------------------- */}
        </div>
    );
}

export default EvaluationHistoryPage;
