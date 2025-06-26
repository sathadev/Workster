// frontend/src/components/SalarySummary.jsx
import { Card } from 'react-bootstrap';

const SummaryCard = ({ borderColor, textColor, title, value, unit = 'บาท' }) => (
    <Card className={`border-${borderColor}`}>
        <Card.Body className="text-center">
            <h5 className={`card-title text-${textColor}`}>{title}</h5>
            <h2 className={`text-${textColor}`}>{value.toLocaleString('th-TH')} {unit}</h2>
        </Card.Body>
    </Card>
);

function SalarySummary({ employees = [] }) {
    if (employees.length === 0) {
        return null; // ไม่แสดงผลถ้าไม่มีข้อมูล
    }

    const totalSalary = employees.reduce((sum, emp) => sum + (Number(emp.total_salary) || 0), 0);
    
    const employeesWithSalary = employees.filter(emp => emp.total_salary > 0);
    const averageSalary = employeesWithSalary.length > 0 
        ? totalSalary / employeesWithSalary.length 
        : 0;

    return (
        <div className="row mt-4">
            <div className="col-md-4 mb-3">
                <SummaryCard 
                    borderColor="primary" 
                    textColor="primary" 
                    title="จำนวนพนักงาน" 
                    value={employees.length} 
                    unit="คน"
                />
            </div>
            <div className="col-md-4 mb-3">
                <SummaryCard 
                    borderColor="success" 
                    textColor="success" 
                    title="เงินเดือนรวมทั้งหมด" 
                    value={totalSalary} 
                />
            </div>
            <div className="col-md-4 mb-3">
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