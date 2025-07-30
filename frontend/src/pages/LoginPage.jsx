// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import api from '../api/axios'
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- 1. ดึงฟังก์ชัน login จาก Context มาใช้งาน

const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); 

        // ตรวจสอบให้แน่ใจว่าเราส่งข้อมูลที่ถูกต้องไปใน object
        const credentials = { 
            emp_username: username, 
            emp_password: password 
        };
        
        // ถ้าค่าใดค่าหนึ่งว่าง ก็ไม่ควรส่งไปแต่แรก
        if (!credentials.emp_username || !credentials.emp_password) {
            setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }

        try {
            // เรียกใช้ฟังก์ชัน login จาก context
            const loginData = await login(credentials);

            // Log ข้อมูลที่ได้กลับมา (ถ้าต้องการ)
            console.log('Login Success:', loginData); 

            // เมื่อ login สำเร็จ ให้ navigate ไปหน้าหลัก
            navigate('/'); 

        } catch (err) {
            // *** จุดสำคัญ ***
            // ถ้า login() ใน Context โยน Error ออกมา มันจะถูกจับได้ที่นี่
            // แต่ไม่แสดง error "บริษัทของคุณยังไม่ได้รับการอนุมัติ" เพราะจะไปแสดงใน dashboard แทน
            const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
            // ถ้าเป็น error เกี่ยวกับบริษัทยังไม่ได้รับการอนุมัติ ให้ login ผ่านไปเลย
            if (errorMessage.includes('ยังไม่ได้รับการอนุมัติ')) {
                // ไม่ต้องแสดง error ให้ login ผ่านไป
                return;
            }
            setError(errorMessage);
        }
    };

  return (
    <div className="login-body">
      <div className="login-container">
        <img src="/images/logo.png" alt="WorkSter Logo" className="login-logo" />
        <form onSubmit={handleSubmit}>
            <input type="text" className="form-control" name="emp_username" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)}/>
            <input type="password" className="form-control" name="emp_password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
            {error && (
              <div className="alert alert-danger mt-3">{error}</div>
            )}
            <button type="submit" className="btn btn-login mt-3">
              Login
            </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;