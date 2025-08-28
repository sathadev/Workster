// frontend/src/components/AttendanceCards.jsx
import { Card } from 'react-bootstrap';

// ไม่ต้องแก้ไข StatCard component
const StatCard = ({ className, title, value, unit = 'ครั้ง' }) => (
    <Card className={className}>
        <Card.Body>
            <Card.Title>{title}</Card.Title>
            <h1 className="card-value text-end">{value ?? 0}</h1>
            <p className="card-text text-end mb-0" style={{ fontSize: '0.9rem' }}>{unit}</p>
        </Card.Body>
    </Card>
);

function AttendanceCards({ summary, leaveCount }) {
    if (!summary) return null;

    return (
        // --- CHANGED: เพิ่ม className "dashboard-summary" ที่ตัวครอบ ---
        <div className="row dashboard-summary">
            <div className="col-md-4 mb-3">
                {/* --- CHANGED: ใช้ className "bg-ontime" --- */}
                <StatCard className="bg-ontime text-white" title={<span style={{ fontSize: "1.1rem" }}>มาตรงเวลา</span>} value={summary.ontimeCheckin} />
            </div>
            <div className="col-md-4 mb-3">
                {/* --- CHANGED: ใช้ className "bg-late" --- */}
                <StatCard className="bg-late text-white" title={<span style={{ fontSize: "1.1rem" }}>มาสาย</span>} value={summary.lateCheckin} />
            </div>
            <div className="col-md-4 mb-3">
                {/* --- CHANGED: ใช้ className "bg-absent" --- */}
                <StatCard className="bg-absent text-white" title={<span style={{ fontSize: "1.1rem" }}>ขาด/ลา</span>} value={leaveCount} />
            </div>
        </div>
    );
}
export default AttendanceCards;