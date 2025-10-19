// frontend/src/pages/Leavework/LeaveRequestListPage.jsx
import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";                 // อินสแตนซ์ axios ที่ตั้ง baseURL + interceptor ไว้แล้ว
import StatusBadge from "../../components/StatusBadge"; // แสดงแท็กสถานะ (pending/approved/rejected)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faInbox,
  faTimes,
  faInfoCircle,
  faSortUp,
  faSortDown,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

function LeaveRequestListPage() {
  // State หลัก ๆ
  const [leaveRequests, setLeaveRequests] = useState([]);  // เก็บรายการคำขอลา (ข้อมูลตาราง)
  const [loading, setLoading] = useState(true);            // true ตอนกำลังโหลดข้อมูลจาก API
  const [error, setError] = useState(null);                // เก็บข้อความ error ถ้าเรียก API ล้มเหลว

  const [isSorting, setIsSorting] = useState(false);       // (ยังไม่ได้ใช้งานจริง) เผื่อแสดงสถานะตอน sort
  const [searchInput, setSearchInput] = useState("");      // ค่าช่อง input ที่ผู้ใช้พิมพ์ค้นหา (ยังไม่ยิง API จนกดค้นหา)

  // เงื่อนไขกรองข้อมูลที่จะส่งไป API
  const [filters, setFilters] = useState({
    search: "",                 // คำค้นหา (ชื่อพนักงาน)
    leaveworktype_id: "",       // ประเภทการลา (ค่าว่าง = ทั้งหมด)
    status: "pending",          // สถานะเริ่มต้น: เอาเฉพาะที่ "รอดำเนินการ"
  });

  // กำหนดคีย์และทิศทางการเรียง (sort)
  const [sortConfig, setSortConfig] = useState({
    key: "leavework_daterequest", // คอลัมน์เริ่มต้นที่จะเรียง
    direction: "desc",            // เรียงจากใหม่ไปเก่า
  });

  // เพจปัจจุบัน + meta จาก API (รวมจำนวนหน้า/รายการ)
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({});

  // เก็บรายการประเภทการลา (สำหรับ dropdown)
  const [leaveTypes, setLeaveTypes] = useState([]);

  // โหลดรายการประเภทการลา 
  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        const response = await api.get("/leave-types"); // เรียก API: /leave-types
        setLeaveTypes(response.data);                   // สมมติ API ส่ง array ของ types มาโดยตรง
      } catch (err) {
        console.error("Failed to fetch leave types for filter:", err);
      }
    };
    fetchLeaveTypes();
  }, []);

  // โหลดรายการคำขอลา ตาม filters/sort/page
  // ใช้ useCallback เพื่อไม่ให้สร้างฟังก์ชันใหม่ทุกครั้ง (ลดการเรียก useEffect เกินจำเป็น)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // รวมพารามิเตอร์ที่จะส่งไป backend
      const params = {
        ...filters,
        sort: sortConfig.key,          // ชื่อคอลัมน์ที่เรียง
        order: sortConfig.direction,   // asc/desc
        page: currentPage,             // เพจปัจจุบัน
        limit: 10,                     // จำนวนรายการต่อหน้า
      };

      const response = await api.get("/leave-requests", { params });

      // สมมติโครงสร้างตอบกลับ: { data: [...], meta: { totalItems, totalPages, currentPage } }
      setLeaveRequests(response.data.data || []);
      setMeta(response.data.meta || {});
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการดึงข้อมูลคำขอลา");
    } finally {
      setLoading(false);
    }
  }, [filters, sortConfig, currentPage]);

  // เรียกโหลดข้อมูลเมื่อ filters/sort/page เปลี่ยน
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ฟังก์ชันช่วย / จัดการเหตุการณ์

  // อนุมัติ/ปฏิเสธสถานะคำขอลา
  const handleUpdateStatus = async (id, status) => {
    // กล่องยืนยันก่อนเปลี่ยนสถานะ
    if (
      !window.confirm(
        `คุณแน่ใจหรือไม่ที่จะ "${status === "approved" ? "อนุมัติ" : "ปฏิเสธ"}" คำขอนี้?`
      )
    ) {
      return; // ยกเลิกถ้าผู้ใช้กด Cancel
    }
    try {
      // PATCH ไปเปลี่ยนสถานะที่ backend
      await api.patch(`/leave-requests/${id}/status`, { status });
      // โหลดข้อมูลใหม่เพื่ออัปเดตหน้าจอ
      fetchData();
      alert(`อัปเดตสถานะเป็น "${status}" สำเร็จ`);
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
      console.error("Frontend: Update status error:", err.response?.data || err.message);
    }
  };

  // แปลงวันที่ให้อ่านง่าย (รูปแบบไทย)
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // ผูกกับช่องค้นหา (บันทึกเฉพาะค่าที่พิมพ์)
  const handleSearchInputChange = (e) => setSearchInput(e.target.value);

  // กด "ค้นหา" -> ย้ายค่า searchInput เข้า filters.search แล้วค่อยเรียก API
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // รีเซ็ตไปหน้าแรกเมื่อเปลี่ยนเงื่อนไข
    setFilters((prev) => ({ ...prev, search: searchInput }));
  };

  // ล้างคำค้นหา
  const clearSearch = () => {
    setSearchInput("");
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  // เปลี่ยนค่า filter อื่น ๆ (เช่น ประเภทการลา)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setCurrentPage(1); // เปลี่ยน filter แล้วกลับไปหน้าแรก
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  // กดหัวคอลัมน์เพื่อเรียงข้อมูล
  const handleSort = (key) => {
    setCurrentPage(1);
    let direction = "asc";
    // ถ้ากดซ้ำคีย์เดิมและกำลังเป็น asc -> สลับเป็น desc
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    setIsSorting(true);   // (ถ้าจะใช้แสดงสถานะระหว่าง sort)
    // หมายเหตุ: setIsSorting ไม่ได้ถูกนำไปใช้งานแสดงผลในโค้ดนี้
  };

  // เปลี่ยนหน้า (Prev/Next)
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && (!meta.totalPages || newPage <= meta.totalPages)) {
      setCurrentPage(newPage);
    }
  };

  // ส่วนแสดงผล (Render) 

  // ระหว่างโหลดข้อมูล
  if (loading)
    return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;

  // ถ้าเกิดข้อผิดพลาดขณะโหลด
  if (error)
    return (
      <div className="alert alert-danger" style={{ fontSize: "0.95rem" }}>
        {error}
      </div>
    );

  return (
    <div>
      {/* หัวข้อ + ปุ่มไปหน้าประวัติการลา */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-dark" style={{ fontSize: "1.8rem" }}>
          รายการคำขอลา
        </h4>

        {/* ลิงก์ไปหน้า /leave-requests/history */}
        <Link
          to="/leave-requests/history"
          className="btn btn-outline-secondary"
          style={{ fontSize: "1rem" }}
        >
          <FontAwesomeIcon icon={faHistory} className="me-2" /> ประวัติการลา
        </Link>
      </div>

      {/* กล่องฟิลเตอร์หลัก */}
      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          <div className="row g-3 mb-3">
            {/* กล่องค้นหาชื่อพนักงาน */}
            <div className="col-md-6">
              <form onSubmit={handleSearchSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="ค้นหาตามชื่อพนักงาน..."
                    value={searchInput}
                    onChange={handleSearchInputChange}
                    style={{ fontSize: "1rem" }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="submit"
                    style={{ fontSize: "1rem" }}
                  >
                    <FontAwesomeIcon icon={faSearch} />
                  </button>

                  {/* ปุ่มล้างคำค้นหา จะแสดงเฉพาะเมื่อมี filters.search */}
                  {filters.search && (
                    <button
                      onClick={clearSearch}
                      className="btn btn-outline-danger"
                      type="button"
                      title="ล้างการค้นหา"
                      style={{ fontSize: "1rem" }}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* เลือกประเภทการลา */}
            <div className="col-md-6">
              <div className="input-group">
                <label
                  className="input-group-text bg-light text-dark"
                  style={{ fontSize: "1rem" }}
                >
                  ประเภทการลา
                </label>
                <select
                  className="form-select"
                  name="leaveworktype_id"              // ชื่อตรงกับ key ใน filters
                  value={filters.leaveworktype_id}
                  onChange={handleFilterChange}
                  style={{ fontSize: "1rem" }}
                >
                  <option value="">ทั้งหมด</option>
                  {leaveTypes.map((type) => (
                    <option
                      key={type.leaveworktype_id}
                      value={type.leaveworktype_id}
                    >
                      {type.leaveworktype_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* แถบแจ้งผลการค้นหา (จำนวนรายการที่พบ) */}
          {filters.search && !error && (
            <div className="alert alert-info py-2" style={{ fontSize: "0.95rem" }}>
              <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
              ผลการค้นหา "<strong>{filters.search}</strong>" พบ{" "}
              {meta.totalItems || 0} รายการ
            </div>
          )}

          {/*  ตารางข้อมูลคำขอลา*/}
          <div className="table-responsive">
            <table className="table table-hover table-bordered text-center align-middle">
              <thead className="table-light">
                <tr>
                  {/* หัวคอลัมน์: ชื่อ - สกุล (คลิกเพื่อเรียง) */}
                  <th
                    onClick={() => handleSort("emp_name")}
                    style={{ cursor: "pointer", fontSize: "1.05rem", color: "#333" }}
                  >
                    ชื่อ - สกุล{" "}
                    {/* ไอคอนลูกศรขึ้น/ลง ขึ้นกับ sortConfig */}
                    {sortConfig.key === "emp_name" && (
                      <FontAwesomeIcon
                        icon={sortConfig.direction === "asc" ? faSortUp : faSortDown}
                      />
                    )}
                  </th>

                  {/* ประเภทการลา */}
                  <th
                    onClick={() => handleSort("leaveworktype_id")}
                    style={{ cursor: "pointer", fontSize: "1.05rem", color: "#333" }}
                  >
                    ประเภทการลา{" "}
                    {sortConfig.key === "leaveworktype_id" && (
                      <FontAwesomeIcon
                        icon={sortConfig.direction === "asc" ? faSortUp : faSortDown}
                      />
                    )}
                  </th>

                  {/* หมายเหตุ / คำอธิบาย */}
                  <th style={{ fontSize: "1.05rem", color: "#333" }}>
                    หมายเหตุ
                  </th>

                  {/* ช่วงวันที่ลา */}
                  <th
                    onClick={() => handleSort("leavework_daterequest")}
                    style={{ cursor: "pointer", fontSize: "1.05rem", color: "#333" }}
                  >
                    วันที่ลา{" "}
                    {sortConfig.key === "leavework_daterequest" && (
                      <FontAwesomeIcon
                        icon={sortConfig.direction === "asc" ? faSortUp : faSortDown}
                      />
                    )}
                  </th>

                  {/* สถานะ */}
                  <th
                    onClick={() => handleSort("leavework_status")}
                    style={{ cursor: "pointer", fontSize: "1.05rem", color: "#333" }}
                  >
                    สถานะ{" "}
                    {sortConfig.key === "leavework_status" && (
                      <FontAwesomeIcon
                        icon={sortConfig.direction === "asc" ? faSortUp : faSortDown}
                      />
                    )}
                  </th>

                  {/* ปุ่มดำเนินการ (อนุมัติ/ไม่อนุมัติ) */}
                  <th style={{ fontSize: "1.05rem", color: "#333" }}>
                    ดำเนินการ
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* ถ้ามีรายการ แสดงแถวข้อมูล */}
                {leaveRequests.length > 0 ? (
                  leaveRequests.map((leave) => (
                    <tr key={leave.leavework_id}>
                      <td style={{ fontSize: "0.98rem" }}>{leave.emp_name}</td>
                      <td style={{ fontSize: "0.98rem" }}>
                        {leave.leaveworktype_name}
                      </td>
                      <td style={{ fontSize: "0.98rem" }}>
                        {leave.leavework_description}
                      </td>
                      <td style={{ fontSize: "0.98rem" }}>
                        {/* แสดงช่วงวันที่ลาเป็นภาษาไทย */}
                        {formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}
                        {/* หมายเหตุ: ชื่อฟิลด์ฝั่งหลังคือ leavework_end ตามโค้ดเดิมของคุณ */}
                      </td>
                      <td>
                        {/* แสดง Badge สีตามสถานะ */}
                        <StatusBadge status={leave.leavework_status} />
                      </td>
                      <td style={{ minWidth: "180px" }}>
                        {/* ปุ่มจะปรากฏเฉพาะรายการที่ยัง pending */}
                        {leave.leavework_status === "pending" ? (
                          <div className="d-flex justify-content-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus(leave.leavework_id, "approved")}
                              className="btn btn-success btn-sm"
                              style={{ fontSize: "0.95rem" }}
                            >
                              อนุมัติ
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(leave.leavework_id, "rejected")}
                              className="btn btn-danger btn-sm"
                              style={{ fontSize: "0.95rem" }}
                            >
                              ไม่อนุมัติ
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.98rem" }}>
                            -
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  // ถ้าไม่มีข้อมูล แสดงข้อความว่างสวยงาม
                  <tr>
                    <td colSpan="6" className="text-center text-muted p-4">
                      <div className="d-flex flex-column justify-content-center align-items-center">
                        <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2" />
                        <span className="mb-0 text-muted" style={{ fontSize: "1.05rem" }}>
                          {filters.search || filters.leaveworktype_id
                            ? "ไม่พบข้อมูลคำขอลาตามเงื่อนไข"
                            : "ไม่พบข้อมูลคำขอลาที่รอดำเนินการตามเงื่อนไข"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/*  แถบเปลี่ยนหน้า (Pagination) */}
          {meta && meta.totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                หน้า {meta.currentPage || 1} / {meta.totalPages || 1} (ทั้งหมด {meta.totalItems || 0} รายการ)
              </span>

              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ fontSize: "0.95rem" }}
                >
                  ก่อนหน้า
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!meta.totalPages || currentPage >= meta.totalPages}
                  style={{ fontSize: "0.95rem" }}
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

export default LeaveRequestListPage;
