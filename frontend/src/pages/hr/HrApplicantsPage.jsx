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

// ฟังก์ชันคืนค่า style ของ <select> ตามสถานะใบสมัคร (ใช้สีช่วยสื่อความหมาย)
const customSelectStyle = (status) => {
  let backgroundColor = "#6c757d"; 
  switch (status) {
    case "rejected":
      backgroundColor = "#dc3545"; 
    case "hired":
      backgroundColor = "#198754"; 
      break;
    case "pending":
      backgroundColor = "#ffc107";
      break;
    case "reviewed":
      backgroundColor = "#0d6efd"; 
      break;
    default:
      break;
  }

  // ซ่อน caret เริ่มต้นของเบราว์เซอร์ แล้วใส่ caret สีขาวเองผ่าน data URI
  return {
    backgroundColor,
    color: "#fff",
    borderColor: backgroundColor,
    fontSize: "0.95rem",
    paddingRight: "2rem",
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23fff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 0.75rem center",
    backgroundSize: "16px 12px",
  };
};

function HrApplicantsPage() {
  // STATE หลักของหน้า 
  const [items, setItems] = useState([]); // รายการผู้สมัคร
  const [meta, setMeta] = useState({
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    itemsPerPage: 10,
  }); 
  const [loading, setLoading] = useState(false); // โหลดตารางอยู่ไหม
  const [error, setError] = useState(null); // เก็บข้อความ error

  // ตัวกรองค้นหา/สถานะ/ประกาศงาน
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    jobPostingId: "",
  });
  const [searchQuery, setSearchQuery] = useState(""); // ค่าที่พิมพ์ในช่องค้นหา


  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // การจัดเรียง (เตรียมไว้ แม้ backend อาจยังไม่รองรับเต็มที่)
  const [sortConfig, setSortConfig] = useState({
    key: "applied_at", // ฟิลด์ที่จะ sort
    direction: "desc", // ทิศทาง asc/desc
  });

  // ดึงข้อมูลจาก API (ใช้ useCallback กัน dependency วิ่งไม่จำเป็น)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // รวม params ทั้งตัวกรอง เพจจิเนชัน และการ sort
      const params = {
        ...filters,
        page,
        pageSize,
        sort: sortConfig.key,
        order: sortConfig.direction,
      };

      // เรียก API: /hr/applicants
      const res = await api.get("/hr/applicants", { params });

      // เซ็ตตาราง + meta
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

  // โหลดข้อมูลเมื่อเปิดหน้า/เมื่อมีการเปลี่ยนตัวกรอง เพจจิเนชัน หรือ sort
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  
  // เปลี่ยนค่าฟิลเตอร์ (เช่น สถานะ) แล้วรีเซ็ตไปหน้า 1
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  };

  // กดปุ่มค้นหา -> ย้ายค่าจากช่องพิมพ์ไปที่ filter.q
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, q: searchQuery }));
    setPage(1);
  };

  // ล้างคำค้นหา
  const handleClearSearch = () => {
    setSearchQuery("");
    setFilters((prev) => ({ ...prev, q: "" }));
    setPage(1);
  };

  // กดหัวคอลัมน์เพื่อสลับทิศทางการ sort
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
    setPage(1);
  };

  // เปลี่ยนหน้า
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= (meta.totalPages || 1)) setPage(newPage);
  };

  // เปลี่ยนสถานะผู้สมัคร (เรียก PATCH ไป backend แล้วรีโหลดตาราง)
  const changeStatus = async (applicationId, newStatus) => {
    if (!window.confirm(`ยืนยันเปลี่ยนสถานะเป็น "${newStatus}" ?`)) return;
    try {
      await api.patch(`/hr/applicants/${applicationId}/status`, { status: newStatus });
      fetchData(); // รีเฟรชตารางหลังอัปเดตสำเร็จ
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err?.response?.data?.message || "อัปเดตสถานะไม่สำเร็จ");
    }
  };

  // (เผื่อใช้) คืนค่าสีตามสถานะ (ใช้กับ badge อื่น ๆ ได้)
  const getStatusColor = (status) => {
    switch (status) {
      case "rejected":
        return { backgroundColor: "#dc3545", color: "#fff" };
      case "hired":
        return { backgroundColor: "#198754", color: "#fff" };
      case "pending":
        return { backgroundColor: "#ffc107", color: "#fff" };
      case "reviewed":
        return { backgroundColor: "#0d6efd", color: "#fff" };
      default:
        return { backgroundColor: "#6c757d", color: "#fff" };
    }
  };

  return (
    <div>
      {/* หัวเรื่องหน้า */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-dark" style={{ fontSize: "1.8rem" }}>
          ผู้มาสมัครงาน
        </h4>
      </div>

      {/* กล่องครอบเนื้อหาหลัก */}
      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          {/* แสดง error หากมี */}
          {error && (
            <Alert variant="danger" className="mt-2" style={{ fontSize: "1rem" }}>
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
            </Alert>
          )}

          {/* แถบค้นหา + ฟิลเตอร์สถานะ */}
          <div className="row g-2 mb-3">
            <div className="col-md-5">
              <Form onSubmit={handleSearchSubmit}>
                <div className="input-group w-100">
                  <Form.Control
                    type="text"
                    placeholder="ค้นหา: ชื่อ / อีเมล / ชื่อประกาศงาน"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ fontSize: "1rem" }}
                  />
                  <Button variant="outline-secondary" type="submit" style={{ fontSize: "1rem" }}>
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                  {/* ปุ่มล้างคำค้นหา (โชว์เมื่อมี filters.q) */}
                  {filters.q && (
                    <Button
                      variant="outline-danger"
                      onClick={handleClearSearch}
                      type="button"
                      title="ล้างการค้นหา"
                      style={{ fontSize: "1rem" }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </Button>
                  )}
                </div>
              </Form>
            </div>

            <div className="col-md-3">
              {/* เลือกสถานะเพื่อกรอง */}
              <Form.Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                style={{ fontSize: "1rem" }}
              >
                <option value="">ทุกสถานะ</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="reviewed">พิจารณาแล้ว</option>
                <option value="rejected">ปฏิเสธ</option>
                <option value="hired">จ้างงานแล้ว</option>
              </Form.Select>
            </div>
          </div>

          {/* แถบแจ้งผลรวมการค้นหา */}
          {filters.q && !loading && (
            <Alert variant="info" className="py-2" style={{ fontSize: "1rem" }}>
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              ผลการค้นหา "<strong>{filters.q}</strong>" พบ {meta.totalItems || 0} รายการ
            </Alert>
          )}

          {/* ตารางรายการผู้สมัคร */}
          <div className="table-responsive">
            <table className="table table-hover table-bordered text-center align-middle">
              <thead className="table-light">
                <tr>
                  {/* คลิกหัวตารางเพื่อสลับการ sort ตามคอลัมน์ */}
                  <th
                    onClick={() => handleSort("applicant_name")}
                    style={{ cursor: "pointer", fontSize: "1.05rem", color: "#333" }}
                  >
                    ชื่อผู้สมัคร{" "}
                    {sortConfig.key === "applicant_name" ? (
                      <FontAwesomeIcon icon={sortConfig.direction === "asc" ? faSortUp : faSortDown} />
                    ) : null}
                  </th>
                  <th
                    onClick={() => handleSort("job_title")}
                    style={{ cursor: "pointer", fontSize: "1.05rem", color: "#333" }}
                  >
                    ประกาศงาน{" "}
                    {sortConfig.key === "job_title" ? (
                      <FontAwesomeIcon icon={sortConfig.direction === "asc" ? faSortUp : faSortDown} />
                    ) : null}
                  </th>
                  <th style={{ fontSize: "1.05rem", color: "#333" }}>สถานะ</th>
                  <th style={{ fontSize: "1.05rem", color: "#333" }}>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {/* แสดง Spinner ตอนโหลด */}
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-5">
                      <Spinner animation="border" />
                    </td>
                  </tr>
                ) : items.length > 0 ? (
                  // มีข้อมูล -> วนแสดงแถวละผู้สมัคร
                  items.map((item) => (
                    <tr key={item.application_id}>
                      <td className="text-center" style={{ fontSize: "0.98rem" }}>
                        {item.applicant_name}
                      </td>
                      <td className="text-center" style={{ fontSize: "0.98rem" }}>
                        {item.job_title || `รหัส: ${item.job_posting_id}`}
                      </td>
                      <td>
                        {/* เปลี่ยนสถานะได้จากตาราง (ปิดใช้งานถ้าตารางไม่มีคอลัมน์ หรือใบสมัครถูกปิด) */}
                        <Form.Select
                          value={item.application_status ?? "pending"}
                          onChange={(e) => changeStatus(item.application_id, e.target.value)}
                          className="w-auto mx-auto"
                          disabled={
                            typeof item.application_status === "undefined" || item.is_finalized === 1
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
                          <option value="pending" style={{ backgroundColor: "#fff", color: "#000" }}>
                            รอดำเนินการ
                          </option>
                          <option value="reviewed" style={{ backgroundColor: "#fff", color: "#000" }}>
                            พิจารณาแล้ว
                          </option>
                          <option value="rejected" style={{ backgroundColor: "#fff", color: "#000" }}>
                            ปฏิเสธ
                          </option>
                          <option value="hired" style={{ backgroundColor: "#fff", color: "#000" }}>
                            จ้างงานแล้ว
                          </option>
                        </Form.Select>

                        {/* โชว์ข้อความกำกับถ้าใบสมัครถูกปิดการดำเนินการ */}
                        {item.is_finalized === 1 && (
                          <div className="small text-muted mt-1" style={{ fontSize: "0.85rem" }}>
                            ปิดการดำเนินการแล้ว
                          </div>
                        )}
                      </td>
                      <td>
                        {/* ปุ่มไปหน้ารายละเอียดผู้สมัคร */}
                        <Link
                          to={`/hr/applicants/${item.application_id}`}
                          className="btn btn-info btn-sm text-white"
                          style={{ fontSize: "0.95rem" }}
                        >
                          <FontAwesomeIcon icon={faEye} /> ดูรายละเอียด
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  // ไม่มีข้อมูล -> แสดงกล่องว่าง
                  <tr>
                    <td colSpan="4" className="text-center text-muted p-4">
                      <div className="d-flex flex-column align-items-center">
                        <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block" />
                        <h4 className="mb-0 text-muted" style={{ fontSize: "1.2rem" }}>
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

          {/* เพจจิเนชัน (แสดงเมื่อมีมากกว่า 1 หน้า) */}
          {(meta.totalPages || 0) > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                หน้า {meta.currentPage} / {meta.totalPages} (ทั้งหมด {meta.totalItems} รายการ)
              </span>
              <div className="btn-group">
                <Button
                  variant="outline-secondary"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  style={{ fontSize: "0.95rem" }}
                >
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= (meta.totalPages || 1)}
                  style={{ fontSize: "0.95rem" }}
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
