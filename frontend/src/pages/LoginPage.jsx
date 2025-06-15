// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import './LoginPage.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth(); // <-- 1. ดึงฟังก์ชัน login จาก Context มาใช้งาน

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/v1/auth/login',
        {
          emp_username: username,
          emp_password: password,
        }
      );

      // --- ถ้าสำเร็จ ---
      console.log('Login Success:', response.data);
      
      // 2. เรียกใช้ฟังก์ชัน login พร้อมกับส่งข้อมูล user ที่ได้จาก API ไป
      login(response.data.user); 
      
      // 3. สั่งให้เปลี่ยนหน้าไปที่หน้าหลัก
      navigate('/'); 

    } catch (err) {
      // --- ถ้าล้มเหลว ---
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
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