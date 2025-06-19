// frontend/src/api/axios.js
import axios from 'axios';

const apiClient = axios.create({
    // 1. กำหนด URL หลักของ Backend API ของเรา
    baseURL: 'http://localhost:5000/api/v1',

    // 2. ตั้งค่าให้ส่ง Cookie ไปด้วยทุกครั้ง (สำคัญที่สุด)
    withCredentials: true,
});

export default apiClient;