// frontend/src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; 
import EmployeeInfo from "../../components/EmployeeInfo";
import AttendanceCards from "../../components/AttendanceCards";
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
                const response = await api.get('/employees/profile');
                console.log('API Response Data:', response.data);
                setProfileData(response.data);
            } catch (err) {
                console.error("Failed to fetch profile data:", err);
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

    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;
    if (!profileData) return <div className="alert alert-warning" style={{ fontSize: '0.95rem' }}>ไม่พบข้อมูล</div>;

    const { employee, attendanceSummary, approvedLeaveCount } = profileData;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ข้อมูลส่วนตัว</h4> {/* ใช้ h4 เป็น 2rem และ text-dark */}
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>หน้าหลัก / <span className="text-dark">ข้อมูลส่วนตัว</span></p> {/* ปรับขนาดและสี breadcrumb */}

            <div className="card detail-card p-4 mt-4"> {/* เพิ่ม mt-4 */}
                <EmployeeInfo employee={employee} />
                
                <hr className="my-4" />

                <h4 className="fw-bold text-dark mt-2" style={{ fontSize: '1.8rem' }}>สรุปการทำงาน</h4> {/* ใช้ h4 เป็น 2rem และ text-dark */}
                <AttendanceCards summary={attendanceSummary} leaveCount={approvedLeaveCount} />
            </div>
        </div>
    );
}

export default ProfilePage;