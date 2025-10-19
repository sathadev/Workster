// frontend/src/pages/ProfilePage.jsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios'; 
import EmployeeInfo from "../../components/EmployeeInfo";
import AttendanceCards from "../../components/AttendanceCards";
import './EmployeeDetailPage.css'; // ใช้สไตล์เดียวกับหน้า EmployeeDetail (การ์ด/ตัวเลขสรุป)

/* หน้านี้ดึง "โปรไฟล์ของผู้ใช้ที่ล็อกอินอยู่" จาก API (/employees/profile) */
function ProfilePage() {
  const navigate = useNavigate();

  // เก็บผลลัพธ์จาก API (รวม employee, attendanceSummary, approvedLeaveCount)
  const [profileData, setProfileData] = useState(null);

  //  สถานะระหว่างโหลด และ error ข้อความผิดพลาด
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ดึงข้อมูลโปรไฟล์ครั้งแรกที่เข้าหน้า
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true); // เริ่มโหลด
        const response = await api.get('/employees/profile'); // 📡 เรียก API โปรไฟล์ของ user ปัจจุบัน (ต้องมี token)
        console.log('API Response Data:', response.data);
        setProfileData(response.data); // เก็บข้อมูลลง state
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        if (err.response?.status === 401) {
          // ถ้า token หมดอายุ/ไม่ถูกต้อง → เด้งไปหน้า login
          navigate('/login');
        } else {
          //  อื่น ๆ แสดงข้อความผิดพลาดบนหน้า
          setError("เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์");
        }
      } finally {
        setLoading(false); // จบโหลดไม่ว่าจะสำเร็จ/ล้มเหลว
      }
    };

    fetchProfile();
  }, [navigate]); // ใช้ navigate เป็น dependency (ปลอดภัยเมื่อ navigate เปลี่ยนอ้างอิง)

  // แสดงสถานะขณะกำลังโหลด
  if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>;

  //  แสดง error ถ้ามีปัญหาการดึงข้อมูล
  if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

  //  กรณีไม่พบข้อมูล (เช่น API ส่งว่าง)
  if (!profileData) return <div className="alert alert-warning" style={{ fontSize: '0.95rem' }}>ไม่พบข้อมูล</div>;

  //  แตก object ที่ต้องใช้ในการแสดงผล
  const { employee, attendanceSummary, approvedLeaveCount } = profileData;

  return (
    <div>
      {/*  หัวข้อหน้า */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>
          ข้อมูลส่วนตัว
        </h4>
      </div>

      {/* กล่องข้อมูลหลัก: ใช้ .detail-card จาก CSS ที่รีใช้กับหน้า Detail */}
      <div className="card detail-card p-4 mt-4">
        {/*  แสดงข้อมูลโปรไฟล์พนักงาน (รูป/ชื่อ/ตำแหน่ง/อีเมล/เบอร์/ที่อยู่/สถานะ/วันเกิด ฯลฯ) */}
        <EmployeeInfo employee={employee} />

        <hr className="my-4" />

        {/* สรุปการทำงาน (เช่น จำนวนวันเข้างาน ขาด ลา ฯลฯ) */}
        <h4 className="fw-bold text-dark mt-2" style={{ fontSize: '1.8rem' }}>
          สรุปการทำงาน
        </h4>
        <AttendanceCards
          summary={attendanceSummary}     // object รวมสถิติการเข้างาน (ฝั่ง backend ส่งมา)
          leaveCount={approvedLeaveCount} // จำนวนวันลาที่อนุมัติแล้ว
        />
      </div>
    </div>
  );
}

export default ProfilePage;
