// frontend/src/pages/EmployeeDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import EmployeeInfo from '../../components/EmployeeInfo';
import api from '../../api/axios';
import AttendanceCards from '../../components/AttendanceCards';
import './EmployeeDetailPage.css'; // ใช้ CSS เดียวกัน

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
                const response = await api.get(`/employees/${id}`);
                setEmployeeData(response.data);
            } catch (err) {
                console.error("Failed to fetch employee details:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchEmployeeDetails();
    }, [id]);

    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>; /* ปรับสี text-muted */
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>; /* ปรับขนาด error message */
    if (!employeeData) return <div className="alert alert-warning" style={{ fontSize: '0.95rem' }}>ไม่พบข้อมูลพนักงาน</div>;

    const { employee, attendanceSummary, approvedLeaveCount } = employeeData;

    return (
        <div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}> {/* ปรับขนาดและสี breadcrumb */}
                <Link to="/employees" className="text-secondary text-decoration-none link-primary-hover">พนักงาน</Link> / <span className="text-dark">{employee.emp_name}</span>
            </p>
            <div className="card detail-card p-4 mt-4"> {/* เพิ่ม mt-4 */}
                <EmployeeInfo employee={employee} />
                <hr className="my-4" />
                <h4 className="fw-bold text-dark mt-2" style={{ fontSize: '1.8rem' }}>สรุปการทำงาน</h4> {/* ใช้ h4 เป็น 2rem และ text-dark */}
                <AttendanceCards summary={attendanceSummary} leaveCount={approvedLeaveCount} />
                <div className="d-flex justify-content-end mt-4">
                    <button onClick={() => navigate(`/employees/edit/${employee.emp_id}`)} className="btn btn-warning ms-2 text-white" style={{ fontSize: '1rem' }}>อัพเดท</button>
                    {/* ในอนาคตจะเพิ่มปุ่มลบที่เชื่อมกับ Modal ที่นี่ */}
                </div>
            </div>
        </div>
    );
}
export default EmployeeDetailPage;