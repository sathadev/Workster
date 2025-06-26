// frontend/src/pages/Employees/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; 
import EmployeeInfo from "../../components/EmployeeInfo"; // <-- เพิ่ม ../ อีกหนึ่งอัน
import AttendanceCards from "../../components/AttendanceCards"; // <-- เพิ่ม ../ อีกหนึ่งอัน
import './EmployeeDetailPage.css'; // ใช้ CSS เดียวกับหน้า Detail ได้เลย

function ProfilePage() {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                // ยิง API ไปที่ Endpoint สำหรับดึงข้อมูลโปรไฟล์ตัวเอง
                const response = await api.get('/employees/profile');
                console.log('API Response Data:', response.data);
                setProfileData(response.data);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
                // ถ้าไม่ได้รับอนุญาต (เช่น cookie หมดอายุ) ให้ส่งไปหน้า login
                if (err.response?.status === 401) {
                    navigate('/login');
                } else {
                    setError("เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!profileData) return <div className="alert alert-warning">ไม่พบข้อมูล</div>;

    const { employee, attendanceSummary, approvedLeaveCount } = profileData;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">ข้อมูลส่วนตัว</h4>
            </div>
            <p>หน้าหลัก / ข้อมูลส่วนตัว</p>

            <div className="card detail-card p-4">
                {/* แสดงข้อมูลส่วนตัวและรูปภาพ (ใช้ Component ซ้ำ) */}
                <EmployeeInfo employee={employee} />
                
                <hr className="my-4" />

                <h4 className="fw-bold mt-2">สรุปการทำงาน</h4>
                {/* แสดงการ์ดสรุปการลงเวลา (ใช้ Component ซ้ำ) */}
                <AttendanceCards summary={attendanceSummary} leaveCount={approvedLeaveCount} />
            </div>
        </div>
    );
}

export default ProfilePage;