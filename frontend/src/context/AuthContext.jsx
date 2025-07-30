// frontend/src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // สถานะ loading สำหรับ AuthContext

    // useEffect นี้จะทำงานเมื่อ Component (AuthContext.Provider) ถูก Mount ครั้งแรกเท่านั้น
    // ใช้สำหรับตรวจสอบ Token ที่มีอยู่แล้วใน localStorage
    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/profile');
                    setUser(response.data); // ตั้งค่า user จากข้อมูลที่ดึงได้
                } catch (err) {
                    // ถ้า Token ไม่ถูกต้อง/หมดอายุ
                    localStorage.removeItem('token'); // ลบ Token
                    setUser(null); // ตั้ง user เป็น null
                }
            }
            setLoading(false); // เมื่อตรวจสอบ Token เสร็จแล้ว (ไม่ว่าจะเจอหรือไม่เจอ) ให้ตั้ง loading เป็น false
        };
        verifyUser();
    }, []); // Dependency array ว่างเปล่า: รันแค่ครั้งเดียวตอน Component Mount

    // ฟังก์ชันสำหรับ Login
    const login = async (credentials) => {
        setLoading(true); // ตั้ง loading เป็น true ก่อนเริ่ม Login
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token); // บันทึก Token ลง localStorage
            setUser(userData); // ตั้งค่า user state ใน Context
            
            return response.data; // ส่งข้อมูลกลับไปให้ LoginPage (ถ้าต้องการ)
        } catch (error) {
            localStorage.removeItem('token'); // ลบ Token หาก Login ล้มเหลว
            setUser(null); // ตั้ง user เป็น null หาก Login ล้มเหลว
            throw error; // โยน Error ออกไปเพื่อให้ LoginPage จัดการ
        } finally {
            setLoading(false); // ไม่ว่า Login จะสำเร็จหรือล้มเหลว ก็ตั้ง loading เป็น false เสมอ
        }
    };

    // ฟังก์ชันสำหรับ Logout
    const logout = () => {
        localStorage.removeItem('token'); // ลบ Token
        setUser(null); // ตั้ง user เป็น null
        window.location.href = '/login'; // Redirect ไปหน้า Login (บังคับโหลดใหม่)
    };

    // ค่าที่จะส่งผ่าน Context
    const value = { user, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {/* *** สำคัญ: ลบเงื่อนไข !loading && ออกจากตรงนี้ *** */}
            {/* ProtectedRoute จะจัดการการแสดงผล "กำลังตรวจสอบสิทธิ์..." หรือ redirect ไป /login เอง */}
            {children} 
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
