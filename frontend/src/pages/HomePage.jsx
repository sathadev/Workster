// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ClockInOut from '../components/ClockInOut'; // Assuming ClockInOut and DashboardSummary handle their internal styles well
import DashboardSummary from '../components/DashboardSummary';
import './HomePage.css'; // Make sure this CSS file is imported

function HomePage() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState({
        userAttendance: null,
        summary: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const promises = [
                api.get('/attendance/today'),
            ];

            if (user && user.jobpos_id <= 3) {
                promises.push(api.get('/dashboard/summary'));
            } else {
                promises.push(Promise.resolve({ data: null }));
            }
            
            const [userAttendanceRes, summaryRes] = await Promise.all(promises);

            setDashboardData({
                userAttendance: userAttendanceRes.data,
                summary: summaryRes.data,
            });
            
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err.response?.data || err.message);
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [user, fetchData]);

    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;

    if (error) return <div className="alert alert-danger">{error}</div>;

    const today = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    return (
        <div>
            {/* Adjusted font size and weight for welcome message */}
            <h3 className="mb-1 fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ยินดีต้อนรับ, {user?.emp_name}!</h3>
            {/* Adjusted font size and color for date */}
            <p className="text-muted" style={{ fontSize: '1.05rem' }}>{today}</p>
            <hr/>
            <div className="clock-in-out-section mt-4"> {/* Added mt-4 for spacing */}
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