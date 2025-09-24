// frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const credentials = {
      emp_username: username,
      emp_password: password,
    };

    if (!credentials.emp_username || !credentials.emp_password) {
      setError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
      return;
    }

    try {
      const loginData = await login(credentials);
      console.log("Login Success:", loginData);
      navigate("/");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ";
      setError(errorMessage);
    }
  };

  return (
    <div className="login-body">
      <div className="login-container">
        <img
          src="/images/logo.png"
          alt="WorkSter Logo"
          className="login-logo"
        />
        <h2 className="mb-4 text-dark fw-bold" style={{ fontSize: "1rem" }}>
          เข้าสู่ระบบ WorkSter
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="form-control"
            name="emp_username"
            placeholder="ชื่อผู้ใช้"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="form-control"
            name="emp_password"
            placeholder="รหัสผ่าน"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div
              className="alert alert-danger mt-3"
              style={{ fontSize: "0.95rem" }}
            >
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-login mt-3">
            เข้าสู่ระบบ
          </button>
        </form>
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
