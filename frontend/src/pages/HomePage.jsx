// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios'; // Make sure this is correctly configured with interceptors
import { useAuth } from '../context/AuthContext';
import ClockInOut from '../components/ClockInOut';
import DashboardSummary from '../components/DashboardSummary';
import './HomePage.css';

function HomePage() {
    const { user } = useAuth(); // We need 'user' here to conditionally fetch summary for admins
    const [dashboardData, setDashboardData] = useState({
        userAttendance: null,
        summary: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            // Start loading state
            setLoading(true);
            setError(null); // Clear previous errors

            const promises = [
                // Always fetch user attendance
                api.get('/attendance/today'),
            ];

            // Only fetch dashboard summary if the user is an admin (jobpos_id <= 3)
            if (user && user.jobpos_id <= 3) {
                promises.push(api.get('/dashboard/summary'));
            } else {
                promises.push(Promise.resolve({ data: null })); // Resolve immediately for non-admins
            }
            
            const [userAttendanceRes, summaryRes] = await Promise.all(promises);

            setDashboardData({
                userAttendance: userAttendanceRes.data,
                summary: summaryRes.data, // This will be null for non-admins, as expected
            });
            
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err.response?.data || err.message);
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    }, [user]); // Re-run fetchData if 'user' changes (e.g., after login/logout)

    useEffect(() => {
        // Fetch data only if a user is logged in
        if (user) {
            fetchData();
        } else {
            // If no user, set loading to false immediately
            setLoading(false);
        }
    }, [user, fetchData]); // Dependencies: user and fetchData itself

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;

    if (error) return <div className="alert alert-danger">{error}</div>;

    const today = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    return (
        <div>
            <h3 className="mb-1 fs-4">ยินดีต้อนรับ, {user?.emp_name}!</h3>
            <p className="text-muted">{today}</p>
            <hr/>
            <div className="clock-in-out-section">
                {/* Pass fetchData as onUpdate to re-fetch attendance data after check-in/out */}
                <ClockInOut attendanceData={dashboardData.userAttendance} onUpdate={fetchData} />
            </div>
            {/* Conditionally render DashboardSummary only if user is admin and summary data exists */}
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