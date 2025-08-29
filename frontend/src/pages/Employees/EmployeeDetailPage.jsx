// frontend/src/pages/EmployeeDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'react-bootstrap'; // เพิ่ม Alert, Spinner เพื่อความสมบูรณ์
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'; // เพิ่ม icon ที่จำเป็น

import EmployeeInfo from '../../components/EmployeeInfo';
import api from '../../api/axios';
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

    if (loading) return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="mt-5 text-center"><Alert variant="danger" style={{ fontSize: '0.95rem' }}>{error}</Alert></div>;
    if (!employeeData) return <div className="mt-5 text-center"><Alert variant="warning" style={{ fontSize: '0.95rem' }}>ไม่พบข้อมูลพนักงาน</Alert></div>;

    const { employee, attendanceSummary, approvedLeaveCount } = employeeData;

    return (
        <div>
             <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ข้อมูลพนักงาน</h4>
            <div className="d-flex justify-content-start align-items-center mb-3">
                <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
                    <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
                </Button>
            </div>
            
            
            {/* ส่วนที่ลบออก:
                <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                    <Link to="/employees" 
className="text-secondary text-decoration-none link-primary-hover">พนักงาน</Link> / <span className="text-dark">{employee.emp_name}</span>
                </p>
            */}
            <div className="card detail-card p-4 mt-4">
                <EmployeeInfo employee={employee} />
                <hr className="my-4" />
                <h4 className="fw-bold text-dark mt-2" style={{ fontSize: '1.8rem' }}>สรุปการทำงาน</h4>
                <AttendanceCards summary={attendanceSummary} leaveCount={approvedLeaveCount} />
                <div className="d-flex justify-content-end mt-4">
                    <button onClick={() => navigate(`/employees/edit/${employee.emp_id}`)} className="btn btn-warning ms-2 text-white" style={{ fontSize: '1rem' }}>อัพเดท</button>
                </div>
            </div>
        </div>
    );
}

export default EmployeeDetailPage;