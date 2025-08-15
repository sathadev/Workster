// frontend/src/components/DashboardSummary.jsx
import { Card } from "react-bootstrap";

const StatCard = ({ className, title, value, unit = "คน" }) => (
  <Card
    className={`shadow-sm border-0 ${className}`}
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
        {value ?? 0}
      </h3>
      <p
        className="card-text text-end mb-0 text-muted"
        style={{ fontSize: "0.85rem" }}
      >
        ทั้งหมด/{unit}
      </p>
    </Card.Body>
  </Card>
);

function DashboardSummary({ summaryData }) {
  if (!summaryData) return null;
  // ถ้ามี totalCompanies กับ totalUsers ให้แสดงเฉพาะสองอันนี้ (สำหรับ Super Admin)
  if (
    summaryData.totalCompanies !== undefined &&
    summaryData.totalUsers !== undefined
  ) {
    return (
      <div className="dashboard-summary">
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <StatCard
              title="จำนวนบริษัททั้งหมด"
              value={summaryData.totalCompanies}
              unit="บริษัท"
              className="bg-primary text-white"
            />
          </div>
          <div className="col-md-6 mb-3">
            <StatCard
              title="จำนวนผู้ใช้ทั้งหมด"
              value={summaryData.totalUsers}
              unit="คน"
              className="bg-info text-white"
            />
          </div>
        </div>
      </div>
    );
  }
  const { checkinCount, ontimeCount, lateCount, absentCount } = summaryData;

  return (
    <div className="dashboard-summary">
      <h4 className="fw-bold mt-4 mb-3" style={{ fontSize: "1.3rem" }}>
        สรุปการลงเวลาวันนี้
      </h4>
      <div className="row mb-4">
        <div className="col-md-5 mb-3">
          <StatCard
            title="พนักงานลงงานวันนี้"
            value={checkinCount}
            unit="คน"
            className="bg-white text-dark border"
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-4 mb-3">
          <StatCard
            className="bg-success text-white"
            title="มาตรงเวลา"
            value={ontimeCount}
          />
        </div>
        <div className="col-md-4 mb-3">
          <StatCard
            className="bg-warning text-dark"
            title="มาสาย"
            value={lateCount}
          />
        </div>
        <div className="col-md-4 mb-3">
          <StatCard
            className="bg-danger text-white"
            title="ขาด/ลา"
            value={absentCount}
          />
        </div>
      </div>
    </div>
  );
}
export default DashboardSummary;
