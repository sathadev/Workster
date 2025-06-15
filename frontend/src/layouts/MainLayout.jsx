// frontend/src/layouts/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './MainLayout.css';

function MainLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        // ใช้ div ตัวนอกสุดเป็น Flex Container แนวตั้ง
        <div className="app-container">
            {/* Navbar */}
            <nav className="navbar navbar-dark app-navbar" style={{ backgroundColor: '#1E56A0', padding: '10px' }}>
                <div className="container-fluid">
                    <NavLink className="navbar-brand mb-0 h1 fs-4 text-white text-decoration-none" to="/">WorkSter</NavLink>
                    {user && (
                        <div className="dropdown">
                            <a className="text-white fs-3 dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" style={{textDecoration: 'none'}}>
                                <FontAwesomeIcon icon={faCircleUser} />
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li><a className="dropdown-item" href="#" onClick={handleLogout}>
                                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Log out
                                </a></li>
                            </ul>
                        </div>
                    )}
                </div>
            </nav>

            {/* Main Body (Flex Container แนวนอน) */}
            <div className="main-layout">
                {/* Sidebar */}
                <nav className="sidebar">
                    {user?.jobpos_id <= 3 && (
                        <>
                            <div className="sidebar-header">HR Menu</div>
                            <NavLink to="/employees" className="sidebar-link">ข้อมูลพนักงาน</NavLink>
                            <NavLink to="/leave-requests" className="sidebar-link">รายการทำงานลา</NavLink>
                            <NavLink to="/salaries" className="sidebar-link">จัดการเงินเดือน</NavLink>
                            {/* เพิ่มลิงก์อื่นๆ ของ HR ที่นี่ */}
                        </>
                    )}
                    <div className="sidebar-header">Employee Menu</div>
                    <NavLink to="/profile" className="sidebar-link">ข้อมูลส่วนตัว</NavLink>
                    <NavLink to="/leave-request/new" className="sidebar-link">แจ้งลางาน</NavLink>
                </nav>

                {/* Main Content */}
                <main className="content">
                    <Outlet /> {/* <-- หน้าลูกๆ จะมาแสดงผลตรงนี้ */}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;