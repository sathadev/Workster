// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ClockInOut from '../components/ClockInOut';
import DashboardSummary from '../components/DashboardSummary';
import './HomePage.css';

function HomePage() {
    const { user, loading: authLoading } = useAuth(); // ดึง user และ authLoading จาก AuthContext
    const [dashboardData, setDashboardData] = useState({
        userAttendance: null,
        summary: null,
    });
    const [loading, setLoading] = useState(true); // ใช้ loading แยกสำหรับ HomePage
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        // ไม่ต้อง fetch ถ้า user ยังไม่พร้อม หรือ auth กำลังโหลดอยู่
        if (!user || authLoading) {
            setLoading(true); // ยังคงแสดง loading ถ้า user ยังไม่พร้อม
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const promises = [];

            // ถ้าไม่ใช่ Super Admin ให้ดึงข้อมูล Clock In/Out ของพนักงาน
            if (!user.isSuperAdmin) {
                promises.push(api.get('/attendance/today'));
            } else {
                promises.push(Promise.resolve({ data: null })); // Resolve ทันทีสำหรับ Super Admin
            }

            // ถ้าเป็น Super Admin หรือ HR/Admin (jobpos_id 1,2,3) ให้ดึง Dashboard Summary
            if (user.isSuperAdmin || (user.jobpos_id >= 1 && user.jobpos_id <= 3)) {
                promises.push(api.get('/dashboard/summary'));
            } else {
                promises.push(Promise.resolve({ data: null })); // Resolve ทันทีสำหรับพนักงานทั่วไป
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
    }, [user, authLoading]); // เพิ่ม authLoading ใน dependency array

    useEffect(() => {
        // Trigger fetchData เมื่อ user เปลี่ยน หรือเมื่อ authLoading เปลี่ยนจาก true เป็น false
        // เพื่อให้แน่ใจว่า fetchData ถูกเรียกหลังจาก user ถูกตั้งค่าแล้ว
        if (user && !authLoading) { // เมื่อ user มีค่า และ AuthContext โหลดเสร็จแล้ว
            fetchData();
        } else if (!user && !authLoading) { // ถ้า AuthContext โหลดเสร็จแล้วแต่ไม่มี user (เช่น logout)
            setLoading(false); // หยุด loading ของ HomePage
            setDashboardData({ userAttendance: null, summary: null }); // เคลียร์ข้อมูล
        }
    }, [user, authLoading, fetchData]); // เพิ่ม fetchData ใน dependency array

    // แสดง loading ของ HomePage หรือ AuthContext
    if (authLoading || loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    
    if (error) return <div className="alert alert-danger">{error}</div>;

    const today = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    return (
        <div>
            <h3 className="mb-1 fs-8">ยินดีต้อนรับ {user?.emp_name}!</h3>
            <p className="text-muted">{today}</p>
            

            {/* แจ้งเตือนถ้าบริษัทยังไม่ได้รับการอนุมัติ */}
            {user && !user.isSuperAdmin && user.company_status !== 'approved' && (
                <div className="alert alert-warning text-center fw-bold">
                    บริษัทของคุณยังไม่ได้รับการอนุมัติ โปรดติดต่อผู้ดูแลระบบ
                </div>
            )}

            {/* แสดง ClockInOut เฉพาะเมื่อไม่ใช่ Super Admin และบริษัทได้รับการอนุมัติแล้ว */}
            {!user?.isSuperAdmin && user?.company_status === 'approved' && (
                <div className="clock-in-out-section">
                    <ClockInOut attendanceData={dashboardData.userAttendance} onUpdate={fetchData} />
                </div>
            )}

            {/* แสดง DashboardSummary เฉพาะ Super Admin เท่านั้น */}
            {user?.isSuperAdmin && dashboardData.summary && (
                <>
                    <hr className="my-4"/>
                    {dashboardData.summary.totalCompanies !== undefined && dashboardData.summary.totalUsers !== undefined ? (
                        <DashboardSummary 
                            summaryData={{
                                totalCompanies: dashboardData.summary.totalCompanies,
                                totalUsers: dashboardData.summary.totalUsers,
                            }}
                        />
                    ) : (
                        <p>ไม่พบข้อมูลสรุปสำหรับ Dashboard</p>
                    )}
                </>
            )}

            {/* แสดง DashboardSummary แบบแถบสรุปสำหรับ HR/Admin (jobpos_id 1,2,3) ที่ไม่ใช่ superadmin และบริษัทได้รับการอนุมัติแล้ว */}
            {user && !user.isSuperAdmin && [1,2,3].includes(user.jobpos_id) && user.company_status === 'approved' && dashboardData.summary && dashboardData.summary.ontimeCheckin !== undefined && (
                <>
                    <hr className="my-4"/>
                    <DashboardSummary
                        summaryData={{
                            checkinCount: dashboardData.summary.ontimeCheckin + dashboardData.summary.lateCheckin,
                            ontimeCount: dashboardData.summary.ontimeCheckin,
                            lateCount: dashboardData.summary.lateCheckin,
                            absentCount: dashboardData.summary.absentCount,
                        }}
                    />
                </>
            )}
        </div>
    );
}

export default HomePage;
