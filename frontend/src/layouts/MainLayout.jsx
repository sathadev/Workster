// frontend/src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faSignOutAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import './MainLayout.css';

// Socket.IO imports and useEffect (ถ้าคุณใช้งาน)
import { useEffect } from 'react';
import { io } from "socket.io-client";

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

    // useEffect for Socket.IO connection
    useEffect(() => {
        const socket = io("http://localhost:5000");
        socket.on('connect', () => console.log('✅ Connected to Socket.IO server! ID:', socket.id));
        return () => { socket.disconnect(); };
    }, []);

    return (
        <div className="app-container">
            {/* Navbar (เหมือนเดิม) */}
            <nav className="navbar navbar-dark app-navbar" style={{ backgroundColor: '#1E56A0', padding: '10px' }}>
                <div className="container-fluid">
                    <NavLink className="navbar-brand mb-0 h1 fs-4 text-white text-decoration-none" to="/">WorkSter</NavLink>
                    {user && (
                        <div className="dropdown">
                            <a className="text-white dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" style={{ textDecoration: 'none' }}>
                                <FontAwesomeIcon icon={faCircleUser} className="fs-3" />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><a className="dropdown-item" href="#" onClick={handleProfile}>
                                    <FontAwesomeIcon icon={faUser} className="me-2"/> Profile
                                </a></li>
                                <li><a className="dropdown-item" href="#" onClick={handleLogout}>
                                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Log out
                                </a></li>
                            </ul>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Body */}
            <div className="main-layout">
                {/* --- REFACTORED: อัปเดต Sidebar ให้มีลิงก์ครบถ้วน --- */}
                <nav className="sidebar">
                    {/* ตรวจสอบว่ามี user object อยู่จริงก่อนแสดงเมนู */}
                    {user ? (
                        <>
                            {/* เมนูสำหรับ HR/Admin */}
                            {(user.jobpos_id === 1 || user.jobpos_id === 2 || user.jobpos_id === 3) && (
                                <>
                                    <div className="sidebar-header">รายการ HR</div>
                                    <NavLink to="/employees" className="sidebar-link">ข้อมูลพนักงาน</NavLink>
                                    <NavLink to="/leave-requests" className="sidebar-link">รายการทำงานลา</NavLink>
                                    <NavLink to="/salaries" className="sidebar-link">จัดการเงินเดือน</NavLink>
                                    <NavLink to="/evaluations" className="sidebar-link">การประเมินผล</NavLink>
                                    <NavLink to="/positions" className="sidebar-link">ตำแหน่งงาน</NavLink>
                                    {/* <NavLink to="/apply-work" className="sidebar-link">ผู้สมัครงาน</NavLink> */}
                                    <NavLink to="/settings" className="sidebar-link">ตั้งค่าบริษัท</NavLink>
                                </>
                            )}

                            {/* เมนูสำหรับพนักงานทุกคน */}
                            <div className="sidebar-header">รายการ พนักงาน</div>
                            <NavLink to="/profile" className="sidebar-link">ข้อมูลส่วนตัว</NavLink>
                            <NavLink to="/leave-request/new" className="sidebar-link">แจ้งลางาน</NavLink>
                            <NavLink to="/my-salary" className="sidebar-link">ดูข้อมูลเงินเดือน</NavLink>
                        </>
                    ) : (
                        // กรณีที่ไม่มี user (เผื่อไว้)
                        <NavLink to="/login" className="sidebar-link">กรุณาเข้าสู่ระบบ</NavLink>
                    )}
                </nav>

                {/* Main Content */}
                <main className="content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;