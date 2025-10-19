import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';                 
import api from '../../api/axios';                       // axios instance (baseURL/interceptor)
import { Table, Spinner, Alert, Form, Button } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';  // ป้ายสถานะสี ๆ

function CompanyListPage() {
  // สเตตหลักของหน้า
  const [companies, setCompanies] = useState([]);     // รายการบริษัทที่ได้จาก API
  const [loading, setLoading] = useState(true);       
  const [error, setError] = useState(null);           // ข้อความผิดพลาด
  const [statusFilter, setStatusFilter] = useState('approved'); // ตัวกรองสถานะเริ่มต้น

  // โหลดข้อมูลทุกครั้งที่สถานะกรองเปลี่ยน
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        // ส่ง query param { status: ... } ไปที่ backend
        const res = await api.get('/admin/companies', { params: { status: statusFilter } });
        setCompanies(res.data.data || []); // รองรับกรณีไม่มี data
      } catch (err) {
        // โชว์ error ที่อ่านง่าย (จาก response หรือข้อความทั่วไป)
        setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [statusFilter]); // เปลี่ยน filter → ดึงใหม่

  return (
    <div>
      <h4 className="fw-bold mb-3">ข้อมูลบริษัททั้งหมด</h4>

      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          {/* แถบควบคุมตัวกรองสถานะ */}
          <div className="d-flex mb-3 align-items-center">
            <label className="me-2 text-dark" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
              สถานะ:
            </label>
            <Form.Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)} 
              style={{ maxWidth: 300, fontSize: '1rem' }}
            >
              <option value="approved">บริษัทที่มีในระบบ (อนุมัติแล้ว)</option>
              <option value="pending">บริษัทที่รอดำเนินการ</option>
              <option value="rejected">บริษัทที่ถูกปฏิเสธ</option>
            </Form.Select>
          </div>

          {/* ส่วนแสดงผลตามสถานะโหลด/ผิดพลาด/สำเร็จ */}
          {loading ? (
            // กำลังโหลด
            <div className="text-center mt-5"><Spinner animation="border" /></div>
          ) : error ? (
            // โหลดแล้วแต่ผิดพลาด
            <Alert variant="danger" className="mt-5 text-center">{error}</Alert>
          ) : (
            // โหลดสำเร็จ แสดงตารางข้อมูล
            <div className="table-responsive">
              <Table bordered hover responsive className="text-center align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ชื่อบริษัท</th>
                    <th>อีเมล</th>
                    <th>เบอร์โทร</th>
                    <th>สถานะ</th>
                    <th>วันที่สมัคร</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {/* กรณีไม่มีข้อมูล */}
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center">ไม่พบข้อมูลบริษัท</td>
                    </tr>
                  ) : companies.map(company => (
                    <tr key={company.company_id}>
                      <td>{company.company_name}</td>
                      <td>{company.company_email || '-'}</td>
                      <td>{company.company_phone || '-'}</td>
                      <td><StatusBadge status={company.company_status} /></td> {/* เรนเดอร์สีตามสถานะ */}
                      <td>{company.created_at ? new Date(company.created_at).toLocaleDateString('th-TH') : '-'}</td>
                      <td>
                        {/* ปุ่มดูรายละเอียด (ใช้ as={Link} เพื่อนำทางแบบ SPA) */}
                        <Button
                          variant="info"
                          size="sm"
                          className="text-white"
                          as={Link}
                          to={`/admin/companies/${company.company_id}`}
                        >
                          ดูรายละเอียด
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyListPage;
