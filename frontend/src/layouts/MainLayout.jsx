// frontend/src/layouts/MainLayout.jsx

import { Outlet, NavLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faCircleUser, faSignOutAlt, faUser, faBriefcase, faUserGroup } from '@fortawesome/free-solid-svg-icons';

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

        // ลบ useEffect ที่เชื่อมต่อsocket.io

    }, []);



    return (

        <div className="app-container">

            {/* Navbar */}

            <nav className="navbar navbar-dark app-navbar" style={{ backgroundColor: '#212529 ' }}>

                <div className="container-fluid">

                    <NavLink className="navbar-brand mb-0 h1 fs-4 text-white text-decoration-none ps-3" to="/">WorkSter</NavLink>

                    {user && (

                        <div className="dropdown">

                            <a className="text-white dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" style={{ textDecoration: 'none' }}>

                                <FontAwesomeIcon icon={faCircleUser} className="fs-3" />

                            </a>

                            <ul className="dropdown-menu dropdown-menu-end">

                                {!user.isSuperAdmin && (

                                    <li><a className="dropdown-item" href="#" onClick={handleProfile}>

                                        <FontAwesomeIcon icon={faUser} className="me-3" /> Profile

                                    </a></li>

                                )}

                                <li><a className="dropdown-item" href="#" onClick={handleLogout}>

                                    <FontAwesomeIcon icon={faSignOutAlt} className="me-3" /> Log out

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

                            {user.isSuperAdmin && (

                                <>

                                    <div className="sidebar-header">

                                        <FontAwesomeIcon icon={faBriefcase} className="me-1" /> รายการ Super Admin

                                        </div>

                                    <NavLink to="/admin/companies/all" className="sidebar-link">บริษัทที่มีในระบบ</NavLink>

                                    <NavLink to="/admin/companies/requests" className="sidebar-link">บริษัทที่ยื่นคำขอมา</NavLink>

                                   

                                </>

                            )}

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

                            {(!user.isSuperAdmin  && user.company_status === 'approved') && (

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

                            {(!user.isSuperAdmin && user.company_status !== 'approved' && user.company_status !== 'pending') && (

                                <>

                                    <NavLink to="/register-company" className="sidebar-link">สมัครบริษัท</NavLink>

                                </>

                            )}

                            {(!user.isSuperAdmin && user.company_status === 'pending') && (

                                <>

                                    <div className="sidebar-header">รอการอนุมัติบริษัท</div>

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