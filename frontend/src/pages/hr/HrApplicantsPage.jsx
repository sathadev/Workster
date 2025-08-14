// frontend/src/pages/hr/HrApplicantsPage.jsx
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Card,
  Row,
  Col,
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

  // Fetch data from API  ✅ เปลี่ยน path เป็น /hr/applicants
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

  // Status update handler  ✅ เปลี่ยน path เป็น /hr/applicants/:id/status
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

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">ผู้มาสมัคร (บริษัทของฉัน)</h4>
      </div>

      {error && (
        <Alert variant="danger">
          <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
          {error}
        </Alert>
      )}

      <Card className="shadow-sm p-4">
        {/* Search and Filters */}
        <Row className="g-2 mb-3">
          <Col md={5}>
            <Form onSubmit={handleSearchSubmit}>
              <Form.Group>
                <div className="input-group">
                  <Form.Control
                    type="text"
                    placeholder="ค้นหา: ชื่อ / อีเมล / ชื่อประกาศงาน"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button variant="outline-secondary" type="submit">
                    <FontAwesomeIcon icon={faSearch} />
                  </Button>
                  {filters.q && (
                    <Button
                      variant="outline-danger"
                      onClick={handleClearSearch}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </Button>
                  )}
                </div>
              </Form.Group>
            </Form>
          </Col>
          <Col md={3}>
            <Form.Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">ทุกสถานะ</option>
              <option value="pending">รอดำเนินการ</option>
              <option value="reviewed">พิจารณาแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
              <option value="hired">จ้างงานแล้ว</option>
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Control
                type="text"
                name="jobPostingId"
                placeholder="กรองตาม JobPostingId"
                value={filters.jobPostingId}
                onChange={handleFilterChange}
              />
            </Form.Group>
          </Col>
        </Row>

        {/* Info Alert for search results */}
        {filters.q && !loading && (
          <Alert variant="info" className="py-2">
            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
            ผลการค้นหา "<strong>{filters.q}</strong>" พบ {meta.totalItems || 0}{" "}
            รายการ
          </Alert>
        )}

        {/* Table */}
        <div className="table-responsive">
          <Table hover bordered className="text-center align-middle">
            <thead className="table-light">
              <tr>
                <th
                  onClick={() => handleSort("applicant_name")}
                  style={{ cursor: "pointer" }}
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
                  style={{ cursor: "pointer" }}
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
                <th>สถานะ</th>
                <th>จัดการ</th>
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
                    <td className="text-start">{item.applicant_name}</td>
                    <td className="text-start">
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
                        } // ⛔ ปิดเมื่อ finalized
                        title={
                          typeof item.application_status === "undefined"
                            ? "ตารางไม่มีคอลัมน์ application_status"
                            : item.is_finalized === 1
                            ? "ใบสมัครถูกปิดการดำเนินการแล้ว"
                            : undefined
                        }
                      >
                        <option value="pending">รอดำเนินการ</option>
                        <option value="reviewed">พิจารณาแล้ว</option>
                        <option value="rejected">ปฏิเสธ</option>
                        <option value="hired">จ้างงานแล้ว</option>
                      </Form.Select>
                      {/* แสดง badge เพิ่ม */}
                      {item.is_finalized === 1 && (
                        <div className="small text-muted mt-1">
                          ปิดการดำเนินการแล้ว
                        </div>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/hr/applicants/${item.application_id}`}
                        className="btn btn-info btn-sm text-white"
                      >
                        <FontAwesomeIcon icon={faEye} /> ดูรายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-5">
                    <div className="d-flex flex-column align-items-center">
                      <FontAwesomeIcon icon={faInbox} className="fa-3x mb-3" />
                      <h4>ไม่พบข้อมูลผู้สมัคร</h4>
                      <p>
                        {filters.q || filters.status || filters.jobPostingId
                          ? "ไม่พบข้อมูลตามเงื่อนไขที่เลือก"
                          : "ยังไม่มีผู้สมัครงานสำหรับบริษัทของคุณ"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        {(meta.totalPages || 0) > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3">
            <span className="text-muted">
              หน้า {meta.currentPage} / {meta.totalPages} (ทั้งหมด{" "}
              {meta.totalItems} รายการ)
            </span>
            <div className="btn-group">
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
              >
                ก่อนหน้า
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= (meta.totalPages || 1)}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        )}
      </Card>
    </Container>
  );
}

export default HrApplicantsPage;
