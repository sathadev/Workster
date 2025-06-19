// frontend/src/pages/EmployeeDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EmployeeInfo from '../../components/EmployeeInfo';
import AttendanceCards from '../../components/AttendanceCards';
import './EmployeeDetailPage.css';

function EmployeeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmployeeDetails = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:5000/api/v1/employees/${id}`);
                setEmployeeData(response.data);
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchEmployeeDetails();
    }, [id]);

    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!employeeData) return <div className="alert alert-warning">ไม่พบข้อมูลพนักงาน</div>;
    
    const { employee, attendanceSummary, approvedLeaveCount } = employeeData;

    return (
        <div>
            <p><Link to="/employees">พนักงาน</Link> / {employee.emp_name}</p>
            <div className="card detail-card p-4">
                <EmployeeInfo employee={employee} />
                <hr className="my-4" />
                <h4 className="fw-bold mt-2">สรุปการทำงาน</h4>
                <AttendanceCards summary={attendanceSummary} leaveCount={approvedLeaveCount} />
                <div className="d-flex justify-content-end mt-4">
                     <button onClick={() => navigate(`/employees/edit/${employee.emp_id}`)} className="btn btn-warning ms-2 text-white">อัพเดท</button>
                     {/* ในอนาคตจะเพิ่มปุ่มลบที่เชื่อมกับ Modal ที่นี่ */}
                </div>
            </div>
        </div>
    );
}
export default EmployeeDetailPage;