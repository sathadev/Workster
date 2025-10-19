// frontend/src/pages/HomePage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';     //  ดึงสถานะผู้ใช้/โหลดจาก AuthContext
import ClockInOut from '../components/ClockInOut';     //  คอมโพเนนต์ลงเวลาเข้า-ออกงาน
import DashboardSummary from '../components/DashboardSummary'; // คอมโพเนนต์สรุปแดชบอร์ด
import './HomePage.css';

function HomePage() {
    // ดึง user (ข้อมูลผู้ใช้ที่ล็อกอินอยู่) และสถานะกำลังโหลด auth (authLoading)
    const { user, loading: authLoading } = useAuth();

    // เก็บข้อมูลที่จะแสดงบนหน้า Home (แยกเป็น 2 ส่วน: ข้อมูลลงเวลาของผู้ใช้, ข้อมูลสรุปแดชบอร์ด)
    const [dashboardData, setDashboardData] = useState({
        userAttendance: null, // ข้อมูลเข้า-ออกงานของ "ผู้ใช้ปัจจุบัน"
        summary: null,        // ข้อมูลสรุป (บริษัท/ผู้ใช้ หรือ สรุปเข้า-ออก)
    });

    // สถานะโหลด/ผิดพลาดของหน้า Home เอง (แยกจาก authLoading)
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ฟังก์ชันดึงข้อมูลหลักของหน้า (เรียกใหม่ได้เมื่อมีการลงเวลาเสร็จ)
    const fetchData = useCallback(async () => {
        // ยังไม่เรียก API ถ้า user ยังไม่มี หรือ auth กำลังโหลด
        if (!user || authLoading) {
            setLoading(true); // แสดงโหลดค้างไว้จนกว่า user พร้อม
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const promises = [];

            // ถ้า "ไม่ใช่" Super Admin -> ดึงข้อมูลลงเวลาของพนักงานวันนี้
            if (!user.isSuperAdmin) {
                promises.push(api.get('/attendance/today'));
            } else {
                // ถ้าเป็น Super Admin ไม่ต้องดึงข้อมูลลงเวลา -> ให้ Promise สำเร็จทันทีด้วยค่า null
                promises.push(Promise.resolve({ data: null }));
            }

            // ถ้าเป็น Super Admin หรือ HR/Admin (jobpos_id 1,2,3) -> ดึงข้อมูลสรุปแดชบอร์ด
            if (user.isSuperAdmin || (user.jobpos_id >= 1 && user.jobpos_id <= 3)) {
                promises.push(api.get('/dashboard/summary'));
            } else {
                // พนักงานทั่วไปไม่ต้องโชว์สรุประดับองค์กร -> ส่ง null กลับ
                promises.push(Promise.resolve({ data: null }));
            }
            
            // รอผลทั้งสองอย่างพร้อมกัน
            const [userAttendanceRes, summaryRes] = await Promise.all(promises);

            // เซ็ตข้อมูลสำหรับหน้า
            setDashboardData({
                userAttendance: userAttendanceRes.data, // อาจเป็น null ถ้า Super Admin
                summary: summaryRes.data,               // อาจเป็น null ถ้าไม่ใช่ Super Admin/HR/Admin
            });
        } catch (err) {
            console.error("Failed to fetch dashboard data:", err.response?.data || err.message);
            setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    }, [user, authLoading]); // ให้ re-create ฟังก์ชันเมื่อ user/authLoading เปลี่ยน

    useEffect(() => {
        // ถ้า user พร้อมและ auth โหลดเสร็จ -> ดึงข้อมูล
        if (user && !authLoading) {
            fetchData();
        // ถ้า auth โหลดเสร็จแล้วแต่ไม่มี user (เช่น logout) -> หยุดโหลดและเคลียร์ข้อมูล
        } else if (!user && !authLoading) {
            setLoading(false);
            setDashboardData({ userAttendance: null, summary: null });
        }
    }, [user, authLoading, fetchData]); // เรียกใหม่เมื่อ user/authLoading/fetchData เปลี่ยน

    // ถ้า auth ยังโหลด หรือ หน้า Home ยังโหลด -> แสดงข้อความกำลังโหลด
    if (authLoading || loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    // แสดง error ถ้ามี
    if (error) return <div className="alert alert-danger">{error}</div>;

    // วันที่วันนี้แบบไทย
    const today = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });

    return (
        <div>
            <h3 className="mb-1 fs-8">ยินดีต้อนรับ {user?.emp_name}!</h3>
            <p className="text-muted">{today}</p>
            
            {/* แจ้งเตือนเมื่อบริษัทของผู้ใช้ยัง "ไม่ถูกอนุมัติ" (ยกเว้น Super Admin) */}
            {user && !user.isSuperAdmin && user.company_status !== 'approved' && (
                <div className="alert alert-warning text-center fw-bold">
                    บริษัทของคุณยังไม่ได้รับการอนุมัติ โปรดติดต่อผู้ดูแลระบบ
                </div>
            )}

            {/* แสดงคอมโพเนนต์ลงเวลา เฉพาะ "พนักงานทั่วไป/HR/Admin" และบริษัทได้รับอนุมัติแล้ว */}
            {!user?.isSuperAdmin && user?.company_status === 'approved' && (
                <div className="clock-in-out-section">
                    {/* ส่งข้อมูลเข้า-ออกวันนี้ + ฟังก์ชัน onUpdate (เรียก fetchData ใหม่หลังลงเวลา) */}
                    <ClockInOut attendanceData={dashboardData.userAttendance} onUpdate={fetchData} />
                </div>
            )}

            {/* แสดงสรุประดับองค์กรเฉพาะ Super Admin */}
            {user?.isSuperAdmin && dashboardData.summary && (
                <>
                    <hr className="my-4"/>
                    {/* ป้องกันกรณีค่าขาด -> เช็คว่ามี totalCompanies/totalUsers ก่อน */}
                    {dashboardData.summary.totalCompanies !== undefined && dashboardData.summary.totalUsers !== undefined ? (
                        <DashboardSummary 
                            summaryData={{
                                totalCompanies: dashboardData.summary.totalCompanies, // จำนวนบริษัททั้งหมด
                                totalUsers: dashboardData.summary.totalUsers,         // จำนวนผู้ใช้ทั้งหมด
                            }}
                        />
                    ) : (
                        <p>ไม่พบข้อมูลสรุปสำหรับ Dashboard</p>
                    )}
                </>
            )}

            {/* แสดงสรุปเช็กอินเฉพาะ HR/Admin (jobpos_id 1,2,3), ไม่ใช่ Super Admin และบริษัทได้รับอนุมัติ */}
            {user && !user.isSuperAdmin && [1,2,3].includes(user.jobpos_id) && user.company_status === 'approved' && dashboardData.summary && dashboardData.summary.ontimeCheckin !== undefined && (
                <>
                    <hr className="my-4"/>
                    <DashboardSummary
                        summaryData={{
                            // รวมจำนวนเช็กอินทั้งหมดวันนี้ (ตรงเวลา + สาย)
                            checkinCount: dashboardData.summary.ontimeCheckin + dashboardData.summary.lateCheckin,
                            ontimeCount: dashboardData.summary.ontimeCheckin, // จำนวนเช็กอินตรงเวลา
                            lateCount: dashboardData.summary.lateCheckin,     // จำนวนเช็กอินมาสาย
                            absentCount: dashboardData.summary.absentCount,   // จำนวนขาดงาน
                        }}
                    />
                </>
            )}
        </div>
    );
}

export default HomePage;
