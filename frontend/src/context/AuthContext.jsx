// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // CHANGED: ให้ state เริ่มต้นอ่านค่าจาก localStorage ก่อน
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            return null;
        }
    });

    // ตั้งค่า axios ให้ส่ง cookie ไปด้วยทุกครั้ง (สำคัญมากสำหรับ session)
    axios.defaults.withCredentials = true;

    const login = (userData) => {
        // CHANGED: เมื่อ login ให้บันทึกข้อมูล user ลงใน localStorage ด้วย
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        // CHANGED: เมื่อ logout ให้ลบข้อมูล user ออกจาก localStorage
        localStorage.removeItem('user');
        setUser(null);
        // อาจจะเรียก API /logout ของ backend ที่นี่ในอนาคต
        axios.get('http://localhost:5000/api/v1/auth/logout');
    };

    const value = { user, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};