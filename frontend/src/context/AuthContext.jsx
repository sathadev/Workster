// frontend/src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios'; // <-- Import instance ที่เราสร้างไว้

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/profile');
                    setUser(response.data);
                } catch (err) {
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifyUser();
    }, []);

    const login = async (credentials) => {
        // เราจะ re-throw error เพื่อให้ component ที่เรียกใช้ (LoginPage) รู้ว่ามันล้มเหลว
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            setUser(userData);
            
            return response.data;
        } catch (error) {
            // *** จุดสำคัญ ***
            // เมื่อเกิด Error ให้โยนมันออกไป เพื่อให้ .catch() ใน LoginPage ทำงาน
            throw error; 
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const value = { user, login, logout, loading };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};