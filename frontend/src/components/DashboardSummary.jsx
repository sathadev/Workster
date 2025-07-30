// frontend/src/components/DashboardSummary.jsx
import { Card } from 'react-bootstrap';

const StatCard = ({ className, title, value, unit = 'คน' }) => (
    <Card className={className}>
        <Card.Body>
            <Card.Title>{title}</Card.Title>
            <h1 className="card-value text-end">{value ?? 0}</h1>
            <p className="card-text text-end mb-0">ทั้งหมด/{unit}</p>
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
                        <StatCard title="จำนวนบริษัททั้งหมด" value={summaryData.totalCompanies} unit="บริษัท" />
                    </div>
                    <div className="col-md-6 mb-3">
                        <StatCard title="จำนวนผู้ใช้ทั้งหมด" value={summaryData.totalUsers} unit="คน" />
                    </div>
                </div>
            </div>
        );
    }
    const { checkinCount, ontimeCount, lateCount, absentCount } = summaryData;

    return (
        <div className="dashboard-summary">
            <h4 className="fw-bold mt-4">สรุปการลงเวลาวันนี้</h4>
            <div className="row mb-4">
                <div className="col-md-5 mb-3">
                    <StatCard title="พนักงานลงงานวันนี้" value={checkinCount} />
                </div>
            </div>
            <div className="row">
                <div className="col-md-4 mb-3">
                    <StatCard className="bg-ontime text-white" title="มาตรงเวลา" value={ontimeCount} />
                </div>
                <div className="col-md-4 mb-3">
                    <StatCard className="bg-late text-dark" title="มาสาย" value={lateCount} />
                </div>
                <div className="col-md-4 mb-3">
                    <StatCard className="bg-absent text-white" title="ขาด/ลา" value={absentCount} />
                </div>
            </div>
        </div>
    );
}
export default DashboardSummary;