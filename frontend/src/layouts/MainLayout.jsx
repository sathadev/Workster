// frontend/src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';   //  ใช้สำหรับลิงก์ภายในแอปและสลับหน้า
import { useAuth } from '../context/AuthContext';                  //  ดึงข้อมูลผู้ใช้ (user) และฟังก์ชัน auth จาก Context
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';  //  ใช้แสดงไอคอน FontAwesome
import { faCircleUser, faSignOutAlt, faUser, faBriefcase, faUserGroup } from '@fortawesome/free-solid-svg-icons'; // ไอคอนที่ใช้ในเมนู
import './MainLayout.css';                                                  
import { useEffect } from 'react';                                          

function MainLayout() {
    const { user, logout } = useAuth();   //  ได้ user (ข้อมูลผู้ใช้) และฟังก์ชัน logout
    const navigate = useNavigate();                                 

    const handleLogout = () => {   //  ฟังก์ชันกดออกจากระบบ
        logout();               //  เคลียร์สถานะล็อกอิน
        navigate('/login');     //  เด้งไปหน้าเข้าสู่ระบบ
    };

    const handleProfile = () => {  //  ฟังก์ชันไปหน้าข้อมูลส่วนตัว
        navigate('profile');   //  ไปเส้นทาง /profile (relative จาก layout)
    };

    useEffect(() => {
        // ลบ import { io } from "socket.io-client";
        // ลบ useEffect ที่เชื่อมต่อsocket.io
        // ☝ หมายเหตุ: บล็อกนี้คงไว้เฉย ๆ ไม่มีโค้ดรัน (เหมือนเป็นบันทึกว่าเอา socket ออกแล้ว)
    }, []);

    return (
        <div className="app-container">   {/* ← ตัวครอบเลย์เอาท์ทั้งหมด */}

            {/* Navbar ส่วนบนของแอป */}
            <nav className="navbar navbar-dark app-navbar" style={{ backgroundColor: '#212529 ' }}>
                <div className="container-fluid">
                    {/* โลโก้/ชื่อแบรนด์ กดแล้วกลับหน้าแรก */ }
                    <NavLink className="navbar-brand mb-0 h1 fs-4 text-white text-decoration-none ps-3" to="/">WorkSter</NavLink>

                    {/* มุมขวา: เมนูผู้ใช้ แสดงเฉพาะตอนล็อกอินแล้ว (มี user) */}
                    {user && (
                        <div className="dropdown">
                            {/* ปุ่มรูปโปรไฟล์ เปิดเมนูดรอปดาวน์ */}
                            <a className="text-white dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" style={{ textDecoration: 'none' }}>
                                <FontAwesomeIcon icon={faCircleUser} className="fs-3" /> {/* ไอคอนโปรไฟล์ */}
                            </a>

                            {/* รายการในดรอปดาวน์ */}
                            <ul className="dropdown-menu dropdown-menu-end">
                                {/* ปุ่มไปหน้า Profile แสดงเฉพาะผู้ใช้ทั่วไป (ไม่ใช่ Super Admin) */}
                                {!user.isSuperAdmin && (
                                    <li>
                                        <a className="dropdown-item" href="#" onClick={handleProfile}>
                                            <FontAwesomeIcon icon={faUser} className="me-3" /> Profile
                                        </a>
                                    </li>
                                )}

                                {/* ปุ่ม Log out ออกจากระบบ */}
                                <li>
                                    <a className="dropdown-item" href="#" onClick={handleLogout}>
                                        <FontAwesomeIcon icon={faSignOutAlt} className="me-3" /> Log out
                                    </a>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </nav>

            {/* พื้นที่หลักแบ่งเป็น Sidebar + Content */}
            <div className="main-layout">
                {/* แถบเมนูด้านซ้าย (Sidebar) */}
                <nav className="sidebar">
                    {user ? (                                                  
                        <>
                            {/* กลุ่มเมนูสำหรับ Super Admin */}
                            {user.isSuperAdmin && (
                                <>
                                    <div className="sidebar-header">
                                        <FontAwesomeIcon icon={faBriefcase} className="me-1" /> รายการ Super Admin
                                    </div>
                                    {/* ไปดูรายชื่อบริษัททั้งหมด */}
                                    <NavLink to="/admin/companies/all" className="sidebar-link">บริษัทที่มีในระบบ</NavLink>
                                    {/* ไปดูคำขอสมัครบริษัท */}
                                    <NavLink to="/admin/companies/requests" className="sidebar-link">บริษัทที่ยื่นคำขอมา</NavLink>
                                </>
                            )}

                            {/* กลุ่มเมนูสำหรับ HR/Admin (jobpos_id 1/2/3) และบริษัทต้อง approved แล้ว */}
                            {(!user.isSuperAdmin && (user.jobpos_id === 1 || user.jobpos_id === 2 || user.jobpos_id === 3) && user.company_status === 'approved') && (
                                <>
                                    <div className="sidebar-header">
                                        <FontAwesomeIcon icon={faBriefcase} className="me-1" /> รายการ HR
                                    </div>
                                    <NavLink to="/employees" className="sidebar-link">ข้อมูลพนักงาน</NavLink>
                                    <NavLink to="/leave-requests" className="sidebar-link">รายการทำงานลา</NavLink>
                                    <NavLink to="/salaries" className="sidebar-link">จัดการเงินเดือน</NavLink>
                                    <NavLink to="/evaluations" className="sidebar-link">การประเมินผล</NavLink>
                                    <NavLink to="/positions" className="sidebar-link">ตำแหน่งงาน</NavLink>
                                    <NavLink to="/settings" className="sidebar-link">ตั้งค่าบริษัท</NavLink>
                                    <NavLink to="/job-postings" className="sidebar-link">ประกาศรับสมัครงาน</NavLink>
                                    <NavLink to="/hr/applicants" className="sidebar-link">ผู้มาสมัครงาน</NavLink>
                                </>
                            )}

                            {/* กลุ่มเมนูสำหรับพนักงานทั่วไป (ไม่ใช่ super admin) และบริษัท approved แล้ว */}
                            {(!user.isSuperAdmin  && user.company_status === 'approved') && (
                                <>
                                    <div className="sidebar-header">
                                        <FontAwesomeIcon icon={faUserGroup} className="me-1" /> รายการ พนักงาน
                                    </div>
                                    <NavLink to="/profile" className="sidebar-link">ข้อมูลส่วนตัว</NavLink>
                                    <NavLink to="/leave-request/new" className="sidebar-link">แจ้งลางาน</NavLink>
                                    <NavLink to="/my-leave-history" className="sidebar-link">ประวัติการแจ้งลา</NavLink>
                                    <NavLink to="/my-salary" className="sidebar-link">ดูข้อมูลเงินเดือน</NavLink>
                                </>
                            )}

                            {/* ถ้าบริษัทยังไม่ approved และไม่ใช่ pending (เช่น ไม่มีสถานะ) ให้มีเมนูสมัครบริษัท */}
                            {(!user.isSuperAdmin && user.company_status !== 'approved' && user.company_status !== 'pending') && (
                                <>
                                    <NavLink to="/register-company" className="sidebar-link">สมัครบริษัท</NavLink>
                                </>
                            )}

                            {/* ถ้าบริษัทอยู่ระหว่างรออนุมัติ (pending) แสดงข้อความสถานะ */}
                            {(!user.isSuperAdmin && user.company_status === 'pending') && (
                                <>
                                    <div className="sidebar-header">รอการอนุมัติบริษัท</div>
                                </>
                            )}
                        </>
                    ) : (
                        // ยังไม่ล็อกอิน: แสดงลิงก์ไปหน้า login
                        <NavLink to="/login" className="sidebar-link">กรุณาเข้าสู่ระบบ</NavLink>
                    )}
                </nav>

                {/* พื้นที่เนื้อหาหลักของแต่ละหน้า (ลูก Route จะถูกเรนเดอร์ที่นี่) */}
                <main className="content">
                    <Outlet />                                                
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
