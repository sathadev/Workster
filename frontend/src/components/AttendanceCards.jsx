// frontend/src/components/AttendanceCards.jsx
import { Card } from 'react-bootstrap';

const StatCard = ({ bgColor, textColor = 'text-white', title, value }) => (
    <Card className={`summary-card ${bgColor} ${textColor}`}>
        <Card.Body>
            <Card.Title>{title}</Card.Title>
            <h1 className="card-value text-end">{value ?? 0}</h1>
            <p className="card-text text-end mb-0">ครั้ง</p>
        </Card.Body>
    </Card>
);

function AttendanceCards({ summary, leaveCount }) {
    if (!summary) return null;
    return (
        <div className="row">
            <div className="col-md-4 mb-3">
                <StatCard bgColor="card-green" title="มาตรงเวลา" value={summary.ontimeCheckin} />
            </div>
            <div className="col-md-4 mb-3">
                <StatCard bgColor="card-yellow" textColor="text-dark" title="มาสาย" value={summary.lateCheckin} />
            </div>
            <div className="col-md-4 mb-3">
                <StatCard bgColor="card-red" title="ขาด/ลา (ที่อนุมัติ)" value={leaveCount} />
            </div>
        </div>
    );
}
export default AttendanceCards;