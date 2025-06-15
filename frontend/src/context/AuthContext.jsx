// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // ฟังก์ชันสำหรับ Login (จะถูกเรียกใช้ในหน้า LoginPage)
    const login = (userData) => {
        setUser(userData);
    };

    // ฟังก์ชันสำหรับ Logout
    const logout = () => {
        // TODO: เรียก API /logout ของ Backend ในอนาคต
        setUser(null);
    };

    const value = { user, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// สร้าง Hook ของตัวเองเพื่อให้เรียกใช้ง่าย
export const useAuth = () => {
    return useContext(AuthContext);
};