// frontend/src/components/ProtectedRoute.jsx
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth(); // ดึง user และสถานะ loading จาก AuthContext
    const location = useLocation();

    // 1. ถ้าระบบกำลังตรวจสอบสถานะการล็อกอิน ให้แสดงผลว่า "กำลังโหลด..."
    if (loading) {
        return <div className="text-center mt-5">กำลังตรวจสอบสิทธิ์...</div>;
    }

    // 2. ถ้าตรวจสอบเสร็จแล้ว และไม่พบข้อมูล user (ยังไม่ได้ล็อกอิน)
    if (!user) {
        // ให้เด้งไปหน้า /login และจำหน้าปัจจุบันไว้ใน state
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 3. ถ้ามีข้อมูล user (ล็อกอินแล้ว) ให้แสดงหน้าเว็บนั้นๆ ได้เลย
    return children;
}

export default ProtectedRoute;
