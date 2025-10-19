// frontend/src/components/AttendanceCards.jsx
import { Card } from 'react-bootstrap';

const StatCard = ({ className, title, value, unit = 'ครั้ง' }) => (
    <Card className={className}> {/* ใช้ className ภายนอกมากำหนดธีมสี */}
        <Card.Body>
            <Card.Title>{title}</Card.Title> {/* หัวข้อของการ์ด */}
            <h1 className="card-value text-end">{value ?? 0}</h1> {/* ตัวเลขหลัก (ถ้าไม่มีค่าให้แสดง 0) และจัดชิดขวา */}
            <p className="card-text text-end mb-0" style={{ fontSize: '0.9rem' }}>{unit}</p> {/* หน่วยกำกับ */}
        </Card.Body>
    </Card>
);

function AttendanceCards({ summary, leaveCount }) {
    // ถ้าไม่มีข้อมูล summary ให้ไม่แสดงอะไรเลย (ป้องกัน error ตอนข้อมูลยังโหลดไม่เสร็จ)
    if (!summary) return null;

    return (
        // คอนเทนเนอร์หลักของการ์ดสรุป ใช้ .row ของ Bootstrap
        <div className="row dashboard-summary">
            <div className="col-md-4 mb-3"> {/* คอลัมน์แรก: มาตรงเวลา */}
                {/* ใช้คลาสธีมสี bg-ontime และตัวอักษรขาว text-white */}
                <StatCard
                    className="bg-ontime text-white"
                    title={<span style={{ fontSize: "1.1rem" }}>มาตรงเวลา</span>} /* หัวข้อการ์ด */
                    value={summary.ontimeCheckin} /* จำนวนครั้งมาตรงเวลา จาก summary */
                />
            </div>

            <div className="col-md-4 mb-3"> {/* คอลัมน์สอง: มาสาย */}
                {/* ใช้คลาสธีมสี bg-late และตัวอักษรขาว */}
                <StatCard
                    className="bg-late text-white"
                    title={<span style={{ fontSize: "1.1rem" }}>มาสาย</span>}
                    value={summary.lateCheckin} /* จำนวนครั้งมาสาย จาก summary */
                />
            </div>

            <div className="col-md-4 mb-3"> {/* คอลัมน์สาม: ขาด/ลา */}
                {/* ใช้คลาสธีมสี bg-absent และตัวอักษรขาว */}
                <StatCard
                    className="bg-absent text-white"
                    title={<span style={{ fontSize: "1.1rem" }}>ขาด/ลา</span>}
                    value={leaveCount} /* จำนวนครั้งขาด/ลา รับมาจาก prop leaveCount */
                />
            </div>
        </div>
    );
}

export default AttendanceCards;
