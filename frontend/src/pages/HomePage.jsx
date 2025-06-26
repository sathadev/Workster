// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios'
import { useAuth } from '../context/AuthContext';
import ClockInOut from '../components/ClockInOut';
import DashboardSummary from '../components/DashboardSummary';
import './HomePage.css'; // อย่าลืมสร้างไฟล์ CSS นี้

function HomePage() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState({
        userAttendance: null,
        summary: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        // ไม่ต้อง setLoading(true) ที่นี่แล้ว เพราะจะจัดการใน useEffect ตัวแรก
        try {
            const promises = [
                api.get('/attendance/today'),
                user?.jobpos_id <= 3 ? api.get('/dashboard/summary') : Promise.resolve({ data: null })
            ];
            
            const [userAttendanceRes, summaryRes] = await Promise.all(promises);

            setDashboardData({
                userAttendance: userAttendanceRes.data,
                summary: summaryRes.data,
            });
            setError(null);
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    }, [user?.jobpos_id]);

    useEffect(() => {
        if (user) {
            setLoading(true);
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user, fetchData]);

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;

    // เราจะแสดง Error ก็ต่อเมื่อมี Error จริงๆ และไม่ได้กำลังโหลด
    if (error && !loading) return <div className="alert alert-danger">{error}</div>;

    const today = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    return (
        <div>
            <h3 className="mb-1 fs-4">ยินดีต้อนรับ, {user?.emp_name}!</h3>
            <p className="text-muted">{today}</p>
            <hr/>
            <div className="clock-in-out-section">
                <ClockInOut attendanceData={dashboardData.userAttendance} onUpdate={fetchData} />
            </div>
            {user?.jobpos_id <= 3 && dashboardData.summary && (
                <>
                    <hr className="my-4"/>
                    <DashboardSummary summaryData={dashboardData.summary} />
                </>
            )}
        </div>
    );
}

export default HomePage;