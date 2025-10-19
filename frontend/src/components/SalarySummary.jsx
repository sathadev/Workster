// frontend/src/components/SalarySummary.jsx
import { Card } from 'react-bootstrap';

const SummaryCard = ({ borderColor, textColor, title, value, unit = 'บาท' }) => (
    <Card className={`border-${borderColor}`}> {/* ใส่คลาสขอบสีตามที่ส่งมา */}
        <Card.Body className="text-center">
            <h5 className={`card-title text-${textColor}`}>{title}</h5> {/* หัวข้อการ์ด สีตาม textColor */}
            <h2 className={`text-${textColor}`}>
                {/* แสดงค่าตัวเลขในรูปแบบตัวเลขไทย พร้อมหน่วย (เช่น บาท/คน) */}
                {value.toLocaleString('th-TH')} {unit}
            </h2>
        </Card.Body>
    </Card>
);

function SalarySummary({ employees = [] }) {
    // ถ้าไม่มีรายการพนักงานเลย ไม่ต้องแสดงอะไร (ป้องกันพื้นที่ว่างเกินจำเป็น)
    if (employees.length === 0) {
        return null;
    }

    // totalSalary = ผลรวมเงินเดือนสุทธิของพนักงานทั้งหมด (ถ้าไม่มีค่าหรือไม่ใช่ตัวเลข ให้ใช้ 0)
    const totalSalary = employees.reduce(
        (sum, emp) => sum + (Number(emp.total_salary) || 0),
        0
    );

    // ตัดเฉพาะคนที่มีเงินเดือนสุทธิ > 0 เพื่อคำนวณค่าเฉลี่ย
    const employeesWithSalary = employees.filter(emp => emp.total_salary > 0);

    // averageSalary = ค่าเฉลี่ยของเงินเดือนสุทธิ (ถ้าไม่มีคนที่มีเงินเดือน > 0 ให้เป็น 0)
    const averageSalary = employeesWithSalary.length > 0 
        ? totalSalary / employeesWithSalary.length 
        : 0;

    return (
        <div className="row mt-4"> {/* แถวหลักสำหรับวางการ์ด 3 ใบ */}
            <div className="col-md-4 mb-3">
                {/* การ์ด: จำนวนพนักงานทั้งหมด (หน่วย = คน) */}
                <SummaryCard 
                    borderColor="primary"
                    textColor="primary"
                    title="จำนวนพนักงาน"
                    value={employees.length}
                    unit="คน"
                />
            </div>

            <div className="col-md-4 mb-3">
                {/* การ์ด: เงินเดือนรวมทั้งหมด (รวมทุกคน) */}
                <SummaryCard 
                    borderColor="success"
                    textColor="success"
                    title="เงินเดือนรวมทั้งหมด"
                    value={totalSalary}
                    /* unit ใช้ค่าเริ่มต้น = 'บาท' */
                />
            </div>

            <div className="col-md-4 mb-3">
                {/* การ์ด: เงินเดือนเฉลี่ย (ปัดเศษให้เป็นจำนวนเต็มสวย ๆ) */}
                <SummaryCard 
                    borderColor="info"
                    textColor="info"
                    title="เงินเดือนเฉลี่ย"
                    value={Math.round(averageSalary)}
                />
            </div>
        </div>
    );
}

export default SalarySummary;
