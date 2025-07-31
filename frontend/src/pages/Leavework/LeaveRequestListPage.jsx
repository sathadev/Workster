// frontend/src/pages/Leavework/LeaveRequestListPage.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import StatusBadge from "../../components/StatusBadge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faInbox,
  faTimes,
  faInfoCircle,
  faSort,
  faSortUp,
  faSortDown,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

function LeaveRequestListPage() {
  // --- State Management และ Hooks ทั้งหมด (เหมือนเดิม) ---
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSorting, setIsSorting] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    leaveworktype_id: "",
    status: "pending",
  });
  const [sortConfig, setSortConfig] = useState({
    key: "leavework_daterequest",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({});
  const [leaveTypes, setLeaveTypes] = useState([]);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await api.get("/leave-types");
        setLeaveTypes(response.data);
      } catch (err) {
        console.error("Failed to fetch leave types for filter:", err);
      }
    };
    fetchLeaveTypes();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        sort: sortConfig.key,
        order: sortConfig.direction,
        page: currentPage,
        limit: 10,
      };
      const response = await api.get("/leave-requests", { params });
      setLeaveRequests(response.data.data || []);
      setMeta(response.data.meta || {});
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา");
    } finally {
      setLoading(false);
    }
  }, [filters, sortConfig, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers และ Functions ทั้งหมด (เหมือนเดิม) ---
  const handleUpdateStatus = async (id, status) => {
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ที่จะ "${
          status === "approved" ? "อนุมัติ" : "ปฏิเสธ"
        }" คำขอนี้?`
      )
    ) {
      return;
    }
    try {
      await api.patch(`/leave-requests/${id}/status`, { status });
      fetchData(); // เรียก fetchData ใหม่เพื่อให้รายการอัปเดต
      alert(`อัปเดตสถานะเป็น "${status}" สำเร็จ`);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      console.error(
        "Frontend: Update status error:",
        err.response?.data || err.message
      );
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const handleSearchInputChange = (e) => setSearchInput(e.target.value);
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, search: searchInput }));
  };
  const clearSearch = () => {
    setSearchInput("");
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, search: "" }));
  };
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentPage(1);
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };
  const handleSort = (key) => {
    setCurrentPage(1);
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
      setCurrentPage(newPage);
    }
  };

  if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      {/* --- ส่วน Header และ Filter (เหมือนเดิม) --- */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">รายการคำขอลา (รอดำเนินการ)</h4>
        <Link
          to="/leave-requests/history"
          className="btn btn-outline-secondary"
        >
          <FontAwesomeIcon icon={faHistory} className="me-2" /> ประวัติการลา
        </Link>
      </div>
      <p>หน้าหลัก / รายการคำขอลา</p>
      {/* ... โค้ดส่วน Filter ... */}

      <div className="table-responsive">
        <table className="table table-hover table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              <th
                onClick={() => handleSort("emp_name")}
                style={{ cursor: "pointer" }}
              >
                ชื่อ - สกุล{" "}
                {sortConfig.key === "emp_name" && (
                  <FontAwesomeIcon
                    icon={
                      sortConfig.direction === "asc" ? faSortUp : faSortDown
                    }
                  />
                )}
              </th>
              <th
                onClick={() => handleSort("leaveworktype_id")}
                style={{ cursor: "pointer" }}
              >
                ประเภทการลา{" "}
                {sortConfig.key === "leaveworktype_id" && (
                  <FontAwesomeIcon
                    icon={
                      sortConfig.direction === "asc" ? faSortUp : faSortDown
                    }
                  />
                )}
              </th>
              <th>หมายเหตุ</th>
              <th
                onClick={() => handleSort("leavework_daterequest")}
                style={{ cursor: "pointer" }}
              >
                วันที่ลา{" "}
                {sortConfig.key === "leavework_daterequest" && (
                  <FontAwesomeIcon
                    icon={
                      sortConfig.direction === "asc" ? faSortUp : faSortDown
                    }
                  />
                )}
              </th>
              <th
                onClick={() => handleSort("leavework_status")}
                style={{ cursor: "pointer" }}
              >
                สถานะ{" "}
                {sortConfig.key === "leavework_status" && (
                  <FontAwesomeIcon
                    icon={
                      sortConfig.direction === "asc" ? faSortUp : faSortDown
                    }
                  />
                )}
              </th>
              <th>ดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((leave) => (
                <tr key={leave.leavework_id}>
                  <td>{leave.emp_name}</td>
                  <td>{leave.leaveworktype_name}</td>
                  <td>{leave.leavework_description}</td>
                  <td>
                    {formatDate(leave.leavework_datestart)} -{" "}
                    {formatDate(leave.leavework_end)}
                  </td>
                  <td>
                    <StatusBadge status={leave.leavework_status} />
                  </td>
                  <td style={{ minWidth: "180px" }}>
                    {leave.leavework_status === "pending" ? (
                      <div className="d-flex justify-content-center gap-2">
                        <button
                          onClick={() =>
                            handleUpdateStatus(leave.leavework_id, "approved")
                          }
                          className="btn btn-success btn-sm"
                        >
                          อนุมัติ
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(leave.leavework_id, "rejected")
                          }
                          className="btn btn-danger btn-sm"
                        >
                          ไม่อนุมัติ
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted p-4">
                  <div className="d-flex flex-column justify-content-center align-items-center">
                    <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2" />
                    <h6 className="mb-0">
                      {" "}
                      {/* เปลี่ยนเป็น h6 */}
                      {filters.search || filters.leaveworktype_id
                        ? "ไม่พบข้อมูลคำขอลาตามเงื่อนไข"
                        : "ไม่พบข้อมูลคำขอลาที่รอดำเนินการตามเงื่อนไข"}
                    </h6>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ======================= BUG FIX: นำโค้ด Pagination กลับมาใส่ ======================= */}
      {meta && meta.totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <span className="text-muted">
            หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด{" "}
            {meta.totalItems || 0} รายการ)
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
      {/* =================================================================================== */}
    </div>
  );
}

export default LeaveRequestListPage;
