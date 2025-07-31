// frontend/src/api/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
});

// NEW: สร้าง axios instance สำหรับ Public API (ไม่มี Token Interceptor)
const publicApi = axios.create({
    baseURL: 'http://localhost:5000/api/v1',
});

// Request Interceptor: แนบ Token ไปกับทุก Request (สำหรับ 'api' instance)
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

// Response Interceptor: ดักจับ Token หมดอายุ (Error 401) (สำหรับ 'api' instance)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const token = localStorage.getItem('token');
            if (token) {
                console.warn('Token หมดอายุหรือไม่มีสิทธิ์ โปรดเข้าสู่ระบบใหม่');
                localStorage.removeItem('token');
                window.location.href = '/login'; // Redirect ไปหน้า Login
            }
        }
        return Promise.reject(error);
    }
);

// NEW: เพิ่ม Request Interceptor สำหรับ publicApi เพื่อตรวจสอบว่าไม่ส่ง Token
publicApi.interceptors.request.use(
    (config) => {
        // ตรวจสอบว่าไม่มี Authorization header ถูกแนบไป
        if (config.headers['Authorization']) {
            console.warn('publicApi กำลังส่ง Authorization header โดยไม่ตั้งใจ:', config.headers['Authorization']);
            delete config.headers['Authorization']; // ลบออกถ้ามี (เผื่อกรณีที่ไม่คาดคิด)
        }
        return config;
    },
    (error) => Promise.reject(error)
);


export default api;
export { publicApi }; // <-- Export publicApi ด้วย
