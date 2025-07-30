// frontend/src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faSignOutAlt, faUser, faBuilding, faTachometerAlt } from '@fortawesome/free-solid-svg-icons'; 
import './MainLayout.css';
import { useEffect } from 'react';

function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const handleProfile = () => {
        navigate('profile');
    };

    useEffect(() => {
        // ลบ import { io } from "socket.io-client";
        // ลบ useEffect ที่เชื่อมต่อ socket.io
    }, []);

    return (
        <div className="app-container">
            <nav className="navbar navbar-dark app-navbar" style={{ backgroundColor: '#004aacff', padding: '10px' }}>
                <div className="container-fluid">
                    <NavLink className="navbar-brand mb-0 h1 fs-4 text-white text-decoration-none" to="/">WorkSter</NavLink>
                    {user && (
                        <div className="dropdown">
                            <a className="text-white dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" style={{ textDecoration: 'none' }}>
                                <FontAwesomeIcon icon={faCircleUser} className="fs-3" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                                {/* แสดง Profile เฉพาะผู้ใช้ที่ไม่ใช่ Super Admin */}
                                {!user.isSuperAdmin && (
                                    <li><a className="dropdown-item" href="#" onClick={handleProfile}>
                                        <FontAwesomeIcon icon={faUser} className="me-2"/> Profile
                                    </a></li>
                                )}
                                <li><a className="dropdown-item" href="#" onClick={handleLogout}>
                                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Log out
                                </a></li>
                            </ul>
                        </div>
                    )}
                </div>
            </nav>

            <div className="main-layout">
                <nav className="sidebar">
                    {user ? (
                        <>
                            {/* เมนูสำหรับ Super Admin (jobpos_id = 0 และ company_id = NULL) */}
                            {/* เงื่อนไขถูกปรับให้กระชับขึ้น เนื่องจาก user.isSuperAdmin ถูกกำหนดไว้แล้วใน authMiddleware */}
                            {user.isSuperAdmin && (
                                <>
                                    <div className="sidebar-header">เมนู Super Admin</div>
                                    <NavLink to="/admin/companies/all" className="sidebar-link">
                                        <FontAwesomeIcon icon={faBuilding} className="me-2"/> บริษัทที่มีในระบบ
                                    </NavLink>
                                    <NavLink to="/admin/companies/requests" className="sidebar-link">
                                        <FontAwesomeIcon icon={faBuilding} className="me-2"/> บริษัทที่ยื่นคำขอมา
                                    </NavLink>
                                    <NavLink to="/" className="sidebar-link" end>
                                        <FontAwesomeIcon icon={faTachometerAlt} className="me-2"/> Dashboard
                                    </NavLink>
                                    <NavLink to="/admin/companies" className="sidebar-link">
                                        <FontAwesomeIcon icon={faBuilding} className="me-2"/> จัดการบริษัท
                                    </NavLink>
                                </>
                            )}

                            {/* เมนูสำหรับ HR/Admin (jobpos_id 1, 2, 3) และต้องไม่ใช่ Super Admin และบริษัทได้รับการอนุมัติแล้ว */}
                            {(!user.isSuperAdmin && (user.jobpos_id === 1 || user.jobpos_id === 2 || user.jobpos_id === 3) && user.company_status === 'approved') && (
                                <>
                                    <div className="sidebar-header">รายการ HR</div>
                                    <NavLink to="/employees" className="sidebar-link">ข้อมูลพนักงาน</NavLink>
                                    <NavLink to="/leave-requests" className="sidebar-link">รายการทำงานลา</NavLink>
                                    <NavLink to="/salaries" className="sidebar-link">จัดการเงินเดือน</NavLink>
                                    <NavLink to="/evaluations" className="sidebar-link">การประเมินผล</NavLink>
                                    <NavLink to="/positions" className="sidebar-link">ตำแหน่งงาน</NavLink> {/* <-- Jobpos ยังอยู่ที่นี่สำหรับ HR/Admin */}
                                    <NavLink to="/settings" className="sidebar-link">ตั้งค่าบริษัท</NavLink>
                                </>
                            )}

                            {/* เมนูสำหรับพนักงานทั่วไป (ไม่ใช่ Super Admin และไม่ใช่ HR/Admin) และบริษัทได้รับการอนุมัติแล้ว */}
                            {(!user.isSuperAdmin && !(user.jobpos_id === 0 || user.jobpos_id === 1 || user.jobpos_id === 2 || user.jobpos_id === 3) && user.company_status === 'approved') && (
                                <>
                                    <div className="sidebar-header">รายการ พนักงาน</div>
                                    <NavLink to="/profile" className="sidebar-link">ข้อมูลส่วนตัว</NavLink>
                                    <NavLink to="/leave-request/new" className="sidebar-link">แจ้งลางาน</NavLink>
                                    <NavLink to="/my-leave-history" className="sidebar-link">ประวัติการแจ้งลา</NavLink>
                                    <NavLink to="/my-salary" className="sidebar-link">ดูข้อมูลเงินเดือน</NavLink>
                                </>
                            )}
                        </>
                    ) : (
                        <NavLink to="/login" className="sidebar-link">กรุณาเข้าสู่ระบบ</NavLink>
                    )}
                </nav>
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
