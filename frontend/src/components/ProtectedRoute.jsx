// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
    const { user } = useAuth();

    if (!user) {
        // ถ้าไม่มีข้อมูล user ใน Context ให้ redirect ไปที่หน้า /login
        return <Navigate to="/login" replace />;
    }

    // ถ้ามีข้อมูล user ให้แสดง Component ลูก (หน้าที่เราต้องการปกป้อง)
    return children;
}

export default ProtectedRoute;