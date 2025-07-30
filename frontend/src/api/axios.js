// frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
});

// Request Interceptor: แนบ Token ไปกับทุก Request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: ดักจับ Token หมดอายุ (Error 401)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // เฉพาะกรณีที่มี token อยู่ใน localStorage เท่านั้น
            const token = localStorage.getItem('token');
            if (token) {
                alert('Token หมดอายุหรือไม่มีสิทธิ์ โปรดเข้าสู่ระบบใหม่');
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;