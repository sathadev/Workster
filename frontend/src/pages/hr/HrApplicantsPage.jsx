// frontend/src/pages/hr/HrApplicantsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
    Form,
    Button,
    Table,
    Alert,
    Spinner,
} from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faTimes,
    faEye,
    faInfoCircle,
    faExclamationTriangle,
    faSortUp,
    faSortDown,
    faInbox,
} from "@fortawesome/free-solid-svg-icons";
import api from "../../api/axios";

// เพิ่ม CSS สำหรับ custom select
const customSelectStyle = (status) => {
    let backgroundColor = "#6c757d"; // default gray
    switch (status) {
        case "rejected":
            backgroundColor = "#dc3545"; // Red
            break;
        case "hired":
            backgroundColor = "#198754"; // Green
            break;
        case "pending":
            backgroundColor = "#ffc107"; // Yellow
            break;
        case "reviewed":
            backgroundColor = "#0d6efd"; // Dark Blue
            break;
        default:
            break;
    }
    
    // The key here is to set a solid background and color. 
    // The browser's default caret will often inherit the `color` property.
    return {
        backgroundColor: backgroundColor,
        color: "#fff", // This makes both text and the default caret white
        borderColor: backgroundColor, // Match border color
        fontSize: '0.95rem',
        paddingRight: '2rem', // Add space for the caret so it doesn't overlap text
        appearance: 'none', // Hide the default browser caret for more control
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px 12px',
    };
};

function HrApplicantsPage() {
    // --- State Management ---
    const [items, setItems] = useState([]);
    const [meta, setMeta] = useState({
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        itemsPerPage: 10,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter states
    const [filters, setFilters] = useState({
        q: "",
        status: "",
        jobPostingId: "",
    });
    const [searchQuery, setSearchQuery] = useState("");

    // Pagination states
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Sort states (backendของเรายังไม่ได้รองรับ sort อย่างเป็นทางการ แต่มาเผื่อไว้)
    const [sortConfig, setSortConfig] = useState({
        key: "applied_at",
        direction: "desc",
    });

    // Fetch data from API ✅ เปลี่ยน path เป็น /hr/applicants
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...filters,
                page,
                pageSize,
                sort: sortConfig.key,
                order: sortConfig.direction,
            };

            const res = await api.get("/hr/applicants", { params });
            setItems(res.data.items || []);
            const total = res.data.total || 0;
            setMeta({
                totalItems: total,
                totalPages: Math.max(1, Math.ceil(total / pageSize)),
                currentPage: page,
                itemsPerPage: pageSize,
            });
        } catch (err) {
            console.error("Error fetching applicants:", err);
            setError(err?.response?.data?.message || "โหลดข้อมูลผู้สมัครไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, filters, sortConfig]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
        setPage(1);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setFilters((prev) => ({ ...prev, q: searchQuery }));
        setPage(1);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setFilters((prev) => ({ ...prev, q: "" }));
        setPage(1);
    };

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc")
            direction = "desc";
        setSortConfig({ key, direction });
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= (meta.totalPages || 1)) setPage(newPage);
    };

    // Status update handler ✅ เปลี่ยน path เป็น /hr/applicants/:id/status
    const changeStatus = async (applicationId, newStatus) => {
        if (!window.confirm(`ยืนยันเปลี่ยนสถานะเป็น "${newStatus}" ?`)) return;
        try {
            await api.patch(`/hr/applicants/${applicationId}/status`, {
                status: newStatus,
            });
            fetchData();
        } catch (err) {
            console.error("Error updating status:", err);
            alert(err?.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ");
        }
    };

    // --- Helper function to get status color ---
    const getStatusColor = (status) => {
        switch (status) {
            case "rejected":
                return { backgroundColor: "#dc3545", color: "#fff" }; // Red
            case "hired":
                return { backgroundColor: "#198754", color: "#fff" }; // Green
            case "pending":
                return { backgroundColor: "#ffc107", color: "#fff" }; // Yellow
            case "reviewed":
                return { backgroundColor: "#0d6efd", color: "#fff" }; // Dark Blue
            default:
                return { backgroundColor: "#6c757d", color: "#fff" }; // Gray
        }
    };

    return (
        <div>
            {/* Page Title and Breadcrumbs Section */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ผู้มาสมัครงาน</h4>
            </div>
            

            {/* เพิ่มส่วนนี้เพื่อสร้างกรอบครอบทั้งหมด */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    {/* Error Alert Section */}
                    {error && (
                        <Alert variant="danger" className="mt-2" style={{ fontSize: '1rem' }}>
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                            {error}
                        </Alert>
                    )}

                    {/* Search and Filters Section */}
                    <div className="row g-2 mb-3">
                        <div className="col-md-5">
                            <Form onSubmit={handleSearchSubmit}>
                                <div className="input-group w-100">
                                    <Form.Control
                                        type="text"
                                        placeholder="ค้นหา: ชื่อ / อีเมล / ชื่อประกาศงาน"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{ fontSize: '1rem' }}
                                    />
                                    <Button variant="outline-secondary" type="submit" style={{ fontSize: '1rem' }}>
                                        <FontAwesomeIcon icon={faSearch} />
                                    </Button>
                                    {filters.q && (
                                        <Button
                                            variant="outline-danger"
                                            onClick={handleClearSearch}
                                            type="button"
                                            title="ล้างการค้นหา"
                                            style={{ fontSize: '1rem' }}
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </Button>
                                    )}
                                </div>
                            </Form>
                        </div>
                        <div className="col-md-3">
                            <Form.Select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                style={{ fontSize: '1rem' }}
                            >
                                <option value="">ทุกสถานะ</option>
                                <option value="pending">รอดำเนินการ</option>
                                <option value="reviewed">พิจารณาแล้ว</option>
                                <option value="rejected">ปฏิเสธ</option>
                                <option value="hired">จ้างงานแล้ว</option>
                            </Form.Select>
                        </div>
                        
                    </div>

                    {/* Info Alert for search results */}
                    {filters.q && !loading && (
                        <Alert variant="info" className="py-2" style={{ fontSize: '1rem' }}>
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                            ผลการค้นหา "<strong>{filters.q}</strong>" พบ {meta.totalItems || 0}{" "}
                            รายการ
                        </Alert>
                    )}

                    {/* Table */}
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered text-center align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th
                                        onClick={() => handleSort("applicant_name")}
                                        style={{ cursor: "pointer", fontSize: '1.05rem', color: '#333' }}
                                    >
                                        ชื่อผู้สมัคร{" "}
                                        {sortConfig.key === "applicant_name" ? (
                                            <FontAwesomeIcon
                                                icon={
                                                    sortConfig.direction === "asc" ? faSortUp : faSortDown
                                                }
                                            />
                                        ) : null}
                                    </th>
                                    <th
                                        onClick={() => handleSort("job_title")}
                                        style={{ cursor: "pointer", fontSize: '1.05rem', color: '#333' }}
                                    >
                                        ประกาศงาน{" "}
                                        {sortConfig.key === "job_title" ? (
                                            <FontAwesomeIcon
                                                icon={
                                                    sortConfig.direction === "asc" ? faSortUp : faSortDown
                                                }
                                            />
                                        ) : null}
                                    </th>
                                    <th style={{ fontSize: '1.05rem', color: '#333' }}>สถานะ</th>
                                    <th style={{ fontSize: '1.05rem', color: '#333' }}>จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-5">
                                            <Spinner animation="border" />
                                        </td>
                                    </tr>
                                ) : items.length > 0 ? (
                                    items.map((item) => (
                                        <tr key={item.application_id}>
                                            <td className="text-center" style={{ fontSize: '0.98rem' }}>{item.applicant_name}</td>
                                            <td className="text-center" style={{ fontSize: '0.98rem' }}>
                                                {item.job_title || `รหัส: ${item.job_posting_id}`}
                                            </td>
                                            <td>
                                                <Form.Select
                                                    value={item.application_status ?? "pending"}
                                                    onChange={(e) =>
                                                        changeStatus(item.application_id, e.target.value)
                                                    }
                                                    className="w-auto mx-auto"
                                                    disabled={
                                                        typeof item.application_status === "undefined" ||
                                                        item.is_finalized === 1
                                                    }
                                                    title={
                                                        typeof item.application_status === "undefined"
                                                            ? "ตารางไม่มีคอลัมน์ application_status"
                                                            : item.is_finalized === 1
                                                            ? "ใบสมัครถูกปิดการดำเนินการแล้ว"
                                                            : undefined
                                                    }
                                                    style={customSelectStyle(item.application_status)}
                                                >
                                                    <option value="pending" style={{ backgroundColor: '#fff', color: '#000' }}>รอดำเนินการ</option>
                                                    <option value="reviewed" style={{ backgroundColor: '#fff', color: '#000' }}>พิจารณาแล้ว</option>
                                                    <option value="rejected" style={{ backgroundColor: '#fff', color: '#000' }}>ปฏิเสธ</option>
                                                    <option value="hired" style={{ backgroundColor: '#fff', color: '#000' }}>จ้างงานแล้ว</option>
                                                </Form.Select>
                                                {item.is_finalized === 1 && (
                                                    <div className="small text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                                                        ปิดการดำเนินการแล้ว
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/hr/applicants/${item.application_id}`}
                                                    className="btn btn-info btn-sm text-white"
                                                    style={{ fontSize: '0.95rem' }}
                                                >
                                                    <FontAwesomeIcon icon={faEye} /> ดูรายละเอียด
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted p-4">
                                            <div className="d-flex flex-column align-items-center">
                                                <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block" />
                                                <h4 className="mb-0 text-muted" style={{ fontSize: '1.2rem' }}>
                                                    {filters.q || filters.status || filters.jobPostingId
                                                        ? "ไม่พบข้อมูลตามเงื่อนไขที่เลือก"
                                                        : "ยังไม่มีผู้สมัครงานสำหรับบริษัทของคุณ"}
                                                </h4>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Section */}
                    {(meta.totalPages || 0) > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-3">
                            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
                                หน้า {meta.currentPage} / {meta.totalPages} (ทั้งหมด{" "}
                                {meta.totalItems} รายการ)
                            </span>
                            <div className="btn-group">
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                    style={{ fontSize: '0.95rem' }}
                                >
                                    ก่อนหน้า
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= (meta.totalPages || 1)}
                                    style={{ fontSize: '0.95rem' }}
                                >
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

export default HrApplicantsPage;