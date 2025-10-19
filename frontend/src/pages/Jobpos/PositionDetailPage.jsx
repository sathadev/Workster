// frontend/src/pages/PositionDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Card, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faExclamationTriangle, faInfoCircle, faAngleLeft } from '@fortawesome/free-solid-svg-icons';

function PositionDetailPage() {
  // ดึงพารามิเตอร์ id จาก URL เช่น /positions/3
  const { id } = useParams();
  // ใช้สำหรับปุ่ม "ย้อนกลับ"
  const navigate = useNavigate();

  // เก็บข้อมูลตำแหน่ง + รายชื่อพนักงานในตำแหน่ง
  const [positionData, setPositionData] = useState(null);
  // state สำหรับโหลด/แสดง spinner
  const [loading, setLoading] = useState(true);
  // เก็บข้อความ error (ถ้ามี)
  const [error, setError] = useState(null);

  useEffect(() => {
    // ฟังก์ชันโหลดข้อมูลตำแหน่งจาก API ตาม id
    const fetchData = async () => {
      try {
        setLoading(true);        // เริ่มโหลด
        const response = await api.get(`/positions/${id}`); // เรียก API: GET /positions/:id
        setPositionData(response.data); // เซ็ตข้อมูลที่ได้มาไว้ใน state
      } catch (err) {
        // ถ้าเรียก API ล้มเหลว แสดงข้อความผิดพลาด
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);     
      }
    };
    fetchData();
  }, [id]); // re-run เมื่อ id ใน URL เปลี่ยน

  // ระหว่างกำลังโหลด แสดง Spinner
  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">กำลังโหลด...</span>
        </Spinner>
      </div>
    );
  }

  // ถ้า error ให้แจ้งเตือนเป็น Alert สีแดง
  if (error) {
    return (
      <Alert variant="danger" className="mt-5 text-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        {error}
      </Alert>
    );
  }

  // ถ้าไม่มีข้อมูล (null/undefined) แสดงแจ้งเตือนข้อมูลไม่พบ
  if (!positionData) {
    return (
      <Alert variant="warning" className="mt-5 text-center">
        <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
        ไม่พบข้อมูล
      </Alert>
    );
  }

  // แตกตัวแปรที่ต้องใช้จาก response: position = ข้อมูลตำแหน่ง, employees = รายชื่อพนักงาน
  const { position, employees } = positionData;

  return (
    <div>
      {/* หัวเรื่องของหน้า */}
      <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดตำแหน่ง</h4>

      {/* การ์ดครอบรายละเอียดตำแหน่ง */}
      <Card className="shadow-sm border-0 mt-4">
        {/* ส่วนหัวการ์ด: ทำพื้นหลัง gradient และมีปุ่มย้อนกลับซ้ายมือ */}
        <Card.Header
          className="text-white py-3 position-relative text-center bg-gradient-primary-custom"
        >
          {/* ปุ่มย้อนกลับ: ใช้ navigate(-1) เพื่อกลับหน้าก่อนหน้า */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-link position-absolute start-0 top-50 translate-middle-y ms-3 text-white"
            style={{ fontSize: '1.2rem' }}
            aria-label="ย้อนกลับ"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>

          {/* ชื่อหัวเรื่องภายในการ์ด: ไอคอน + ชื่อตำแหน่ง */}
          <h5 className="mb-0 fw-bold">
            <FontAwesomeIcon icon={faUserGroup} className="me-2" />
            <span className="text-white">{position.jobpos_name}</span>
          </h5>
        </Card.Header>

        {/* เนื้อหาในการ์ด */}
        <Card.Body className="px-md-5">{/* px-md-5 เพื่อระยะขอบด้านข้างดูโปร่งบนจอใหญ่ */}
          {/* สรุปจำนวนพนักงานในตำแหน่งนี้ */}
          <h6 className="fw-bold mb-3 mt-4" style={{ fontSize: '1.05rem' }}>
            รายชื่อพนักงานในตำแหน่งนี้: <span className="text-dark fw-normal">{employees.length} คน</span>
          </h6>

          {/* ถ้ามีพนักงาน แสดงตารางรายชื่อ, ถ้าไม่มี แสดง Alert สีฟ้าว่าไม่พบข้อมูล */}
          {employees.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 text-dark" style={{ fontSize: '1.05rem' }}>ชื่อ - สกุล</th>
                  </tr>
                </thead>
                <tbody>
                  {/* วน map รายชื่อพนักงานเป็นแถวของตาราง */}
                  {employees.map(emp => (
                    <tr key={emp.emp_id}>
                      <td className="ps-4">
                        {/* ลิงก์ไปยังหน้ารายละเอียดพนักงานคนนั้น */}
                        <Link to={`/employees/view/${emp.emp_id}`} className="text-decoration-none text-dark">
                          {emp.emp_name}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert variant="info" className="text-center my-3">
              ไม่พบข้อมูลพนักงานในตำแหน่งนี้
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default PositionDetailPage;
