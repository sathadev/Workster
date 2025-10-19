// frontend/src/components/DashboardSummary.jsx
import { Card } from "react-bootstrap";

const StatCard = ({ className, title, value, unit = "คน" }) => (
  <Card
    className={`shadow-sm border-0 ${className}`}   /* ใส่เงา + ไม่มีเส้นขอบ + ธีมสีจาก className */
    style={{ borderRadius: "10px" }}                 
  >
    <Card.Body className="p-3">
      <Card.Title className="text-muted mb-2" style={{ fontSize: "0.9rem" }}>
        {title}                                      
      </Card.Title>
      <h3
        className="card-value text-end fw-bold mb-0"
        style={{ color: className?.includes("text-white") ? "#fff" : "#333" }}
      >
        {value ?? 0}   {/* แสดงค่าตัวเลข (fallback เป็น 0) */}
      </h3>
      <p
        className="card-text text-end mb-0 text-muted"
        style={{ fontSize: "0.9rem" }}
      >
        ทั้งหมด/{unit}   {/* แสดงคำอธิบายหน่วย ใต้ตัวเลข */}
      </p>
    </Card.Body>
  </Card>
);

function DashboardSummary({ summaryData }) {
  if (!summaryData) return null; /* ถ้าไม่มีข้อมูลสรุป ไม่ต้องแสดงคอมโพเนนต์ */

  /* โหมดที่ 1: สำหรับ Super Admin
     - ถ้ามี totalCompanies และ totalUsers ให้แสดงการ์ด 2 ใบ (จำนวนบริษัททั้งหมด/จำนวนผู้ใช้ทั้งหมด)
  */
  if (
    summaryData.totalCompanies !== undefined &&
    summaryData.totalUsers !== undefined
  ) {
    return (
      <div className="dashboard-summary"> 
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <StatCard
              title={<span style={{ fontSize: "1.1rem" }}>จำนวนบริษัททั้งหมด</span>}
              value={summaryData.totalCompanies}  /* จำนวนบริษัททั้งหมด */
              unit="บริษัท"
              className="bg-primary text-white"  /* พื้นหลังน้ำเงิน + ตัวอักษรขาว */
            />
          </div>
          <div className="col-md-6 mb-3">
            <StatCard
              title={<span style={{ fontSize: "1.1rem" }}>จำนวนผู้ใช้ทั้งหมด</span>}
              value={summaryData.totalUsers}     /* จำนวนผู้ใช้ทั้งหมด */
              unit="คน"
              className="bg-info text-white"     /* พื้นหลังฟ้า + ตัวอักษรขาว */
            />
          </div>
        </div>
      </div>
    );
  }

  /* โหมดที่ 2: สำหรับ HR/Admin
     - แสดงสรุปการลงเวลาวันนี้: ลงงานทั้งหมด, มาตรงเวลา, มาสาย, ขาด/ลา
  */
  const { checkinCount, ontimeCount, lateCount, absentCount } = summaryData;

  return (
    <div className="dashboard-summary"> {/* ตัวครอบเพื่อใช้สไตล์รวมของ dashboard */}
      <h4 className="fw-bold mt-4 mb-3" style={{ fontSize: "1.8rem" }}>
        สรุปการลงเวลาวันนี้
      </h4>

      {/* การ์ดสรุป "พนักงานลงงานวันนี้" 1 ใบใหญ่ */}
      <div className="row mb-4">
        <div className="col-md-5 mb-3">
          <StatCard
            title={<span style={{ fontSize: "1.1rem" }}>พนักงานลงงานวันนี้</span>}
            value={checkinCount}                /* จำนวนที่ลงเวลาเช็คอินแล้ววันนี้ */
            unit="คน"
            className="bg-white text-dark border" /* พื้นขาว ตัวอักษรเข้ม + มีเส้นขอบ */
          />
        </div>
      </div>

      {/* การ์ดสรุป 3 ช่อง: มาตรงเวลา / มาสาย / ขาด-ลา */}
      <div className="row">
        <div className="col-md-4 mb-3">
          <StatCard
            className="bg-success text-white"   /* พื้นเขียว ตัวอักษรขาว */
            title={<span style={{ fontSize: "1.1rem" }}>มาตรงเวลา</span>}
            value={ontimeCount}                  /* จำนวนมาตรงเวลา */
          />
        </div>
        <div className="col-md-4 mb-3">
          <StatCard
            className="my-custom-warning text-white" /* พื้นเหลือง (กำหนดใน CSS เป็นคลาสเตือน) + ตัวอักษรขาว */
            title={<span style={{ fontSize: "1.1rem" }}>มาสาย</span>}
            value={lateCount}                        /* จำนวนมาสาย */
          />
        </div>
        <div className="col-md-4 mb-3">
          <StatCard
            className="bg-danger text-white"    /* พื้นแดง ตัวอักษรขาว */
            title={<span style={{ fontSize: "1.1rem" }}>ขาด/ลา</span>}
            value={absentCount}                 /* จำนวนขาด/ลา */
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardSummary;
