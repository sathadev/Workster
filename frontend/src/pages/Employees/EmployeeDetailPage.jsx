// frontend/src/pages/EmployeeDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'react-bootstrap'; // UI สำเร็จรูป: ปุ่ม/ตัวโหลด/กล่องแจ้งเตือน
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'; // ไอคอนย้อนกลับ

import EmployeeInfo from '../../components/EmployeeInfo';   // ส่วนแสดงข้อมูลโปรไฟล์พนักงาน (แยกเป็นคอมโพเนนต์)
import api from '../../api/axios';                         // อินสแตนซ์ axios (ตั้งค่า baseURL/headers ไว้แล้ว)
import AttendanceCards from '../../components/AttendanceCards'; // การ์ดสรุปการทำงาน (ขาด/ลา/สาย ฯลฯ)
import './EmployeeDetailPage.css';                         // สไตล์ของหน้า (การ์ด/สรุป/ฟอนต์)

function EmployeeDetailPage() {
  // รับพารามิเตอร์ id จาก URL เช่น /employees/view/:id
  const { id } = useParams();

  // Hook ใช้สั่งนำทางกลับ/ไปหน้าอื่น
  const navigate = useNavigate();

  // เก็บข้อมูล/สถานะของหน้า
  const [employeeData, setEmployeeData] = useState(null); // เก็บ payload รวมจาก backend
  const [loading, setLoading] = useState(true);         
  const [error, setError] = useState(null);              

  // โหลดรายละเอียดพนักงานเมื่อเปิดหน้า หรือเมื่อ id เปลี่ยน
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      try {
        setLoading(true);        // เริ่มโหลด
        const response = await api.get(`/employees/${id}`); // GET /employees/:id
        setEmployeeData(response.data); // เก็บข้อมูลที่ได้
      } catch (err) {
        console.error("Failed to fetch employee details:", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล"); // แสดงข้อความผู้ใช้เข้าใจง่าย
      } finally {
        setLoading(false);       // จบโหลดไม่ว่าผลจะสำเร็จ/พลาด
      }
    };
    fetchEmployeeDetails();
  }, [id]);

  // โชว์สถานะระหว่างโหลด
  if (loading)
    return (
      <div className="text-center mt-5 text-muted">
        <Spinner animation="border" /> กำลังโหลดข้อมูล...
      </div>
    );

  // โชว์ error ถ้าโหลดไม่สำเร็จ
  if (error)
    return (
      <div className="mt-5 text-center">
        <Alert variant="danger" style={{ fontSize: '0.95rem' }}>
          {error}
        </Alert>
      </div>
    );

  // กรณีไม่มีข้อมูล (กัน null safety)
  if (!employeeData)
    return (
      <div className="mt-5 text-center">
        <Alert variant="warning" style={{ fontSize: '0.95rem' }}>
          ไม่พบข้อมูลพนักงาน
        </Alert>
      </div>
    );

  // ดึง field ที่ต้องใช้จาก payload 
  const { employee, attendanceSummary, approvedLeaveCount } = employeeData;

  return (
    <div>
      <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>
        ข้อมูลพนักงาน
      </h4>

      {/* ปุ่มย้อนกลับ */}
      <div className="d-flex justify-content-start align-items-center mb-3">
        <Button
          variant="outline-secondary"
          onClick={() => navigate(-1)}
          style={{ fontSize: '1rem' }}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
        </Button>
      </div>

      {/* การ์ดหลักของหน้า ) */}
      <div className="card detail-card p-4 mt-4">
        {/* ส่วนรายละเอียดพนักงานย่อย (ชื่อ, อีเมล, โทร, ตำแหน่ง ฯลฯ) */}
        <EmployeeInfo employee={employee} />

        <hr className="my-4" />

        {/* หัวข้อส่วนสรุป */}
        <h4 className="fw-bold text-dark mt-2" style={{ fontSize: '1.8rem' }}>
          สรุปการทำงาน
        </h4>

        {/* การ์ดสรุป (ลากจากคอมโพเนนต์ AttendanceCards เพื่อแสดงตัวเลขรวม) */}
        <AttendanceCards
          summary={attendanceSummary}
          leaveCount={approvedLeaveCount}
        />

        {/* ปุ่มแก้ไขโปรไฟล์ → ไปหน้า /employees/edit/:id */}
        <div className="d-flex justify-content-end mt-4">
          <button
            onClick={() => navigate(`/employees/edit/${employee.emp_id}`)}
            className="btn btn-warning ms-2 text-white"
            style={{ fontSize: '1rem' }}
          >
            อัพเดท
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDetailPage;
