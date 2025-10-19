// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import api from "../api/axios";               
import { useNavigate } from "react-router-dom"; //  hook สำหรับเปลี่ยนเส้นทาง
import { useAuth } from "../context/AuthContext"; // ใช้ context เพื่อเรียกฟังก์ชัน login
import "./LoginPage.css";                       // ไฟล์สไตล์ของหน้า Login

function LoginPage() {
  //  State หลักของฟอร์ม
  const [username, setUsername] = useState(""); // ชื่อผู้ใช้ที่กรอก
  const [password, setPassword] = useState(""); // รหัสผ่านที่กรอก
  const [error, setError] = useState(null);     // เก็บข้อความผิดพลาดเพื่อแสดงผล

  const navigate = useNavigate();               // ใช้สำหรับกดแล้วเปลี่ยนหน้า
  const { login } = useAuth();                  // ดึงฟังก์ชัน login จาก AuthContext

  //  Handle Submit (กดปุ่มเข้าสู่ระบบ) 
  const handleSubmit = async (e) => {
    e.preventDefault();     // กันรีเฟรชหน้า
    setError("");           // เคลียร์ error 

    // เตรียม payload ให้ตรงกับ backend
    const credentials = {
      emp_username: username,
      emp_password: password,
    };

    // ตรวจฟิลด์ว่างแบบง่าย ๆ ฝั่งหน้าเว็บ
    if (!credentials.emp_username || !credentials.emp_password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      // เรียก login ผ่าน AuthContext (คาดว่าในนั้นจะจัดการ token/เก็บ user ให้)
      const loginData = await login(credentials);
      console.log("Login Success:", loginData);
      navigate("/"); // เข้าสำเร็จ -> กลับหน้าแรก (LandingPage จะ redirect ไป /home ถ้าล็อกอินแล้ว)
    } catch (err) {
      // ถ้า backend ส่ง message มาให้ แสดงข้อความนั้น ไม่งั้นใช้ข้อความทั่วไป
      const errorMessage =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      setError(errorMessage);
    }
  };

  // UI หลัก 
  return (
    <div className="login-body"> 
      <div className="login-container"> {/* กล่องฟอร์ม login ตรงกลาง */}
        <img
          src="/images/logo.png"
          alt="WorkSter Logo"
          className="login-logo"  // โลโก้ด้านบนฟอร์ม
        />
        <h2 className="mb-4 text-dark fw-bold" style={{ fontSize: "1rem" }}>
          เข้าสู่ระบบ WorkSter
        </h2>

        {/* ฟอร์มล็อกอิน */}
        <form onSubmit={handleSubmit}>
          {/* ช่องกรอกชื่อผู้ใช้ */}
          <input
            type="text"
            className="form-control"
            name="emp_username"
            placeholder="ชื่อผู้ใช้"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {/* ช่องกรอกรหัสผ่าน */}
          <input
            type="password"
            className="form-control"
            name="emp_password"
            placeholder="รหัสผ่าน"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* แสดงข้อความผิดพลาด (ถ้ามี) */}
          {error && (
            <div
              className="alert alert-danger mt-3"
              style={{ fontSize: "0.95rem" }}
            >
              {error}
            </div>
          )}

          {/* ปุ่มส่งฟอร์ม */}
          <button type="submit" className="btn btn-login mt-3">
            เข้าสู่ระบบ
          </button>
        </form>

        {/* ลิงก์กลับหน้าหลัก (ไม่ใช่ anchor เพื่อคุมด้วย navigate) */}
        <div className="text-center mt-2">
          <button
            type="button"
            className="btn btn-link btn-sm text-muted"
            onClick={() => navigate("/")}
          >
            ← กลับหน้าหลัก
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
