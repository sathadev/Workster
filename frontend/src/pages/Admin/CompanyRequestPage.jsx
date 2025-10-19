import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';                 
import api from '../../api/axios';                       // axios instance (ตั้ง baseURL/interceptor ไว้แล้ว)
import { Table, Spinner, Alert, Button } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';  

function CompanyRequestPage() {
  // สเตตหลักของหน้า
  const [companies, setCompanies] = useState([]);   // รายการบริษัทที่ดึงมา (สถานะ pending)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);        

  // โหลดครั้งแรกเมื่อ component mount
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      setError(null);
      try {
        // ดึงเฉพาะบริษัท "รอดำเนินการ" (pending)
        const res = await api.get('/admin/companies', { params: { status: 'pending' } });
        setCompanies(res.data.data || []); // กัน null/undefined
      } catch (err) {
        // รวมข้อความ error ที่อ่านง่าย
        setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []); // [] → ทำงานครั้งเดียวตอน mount

  return (
    <div>
      <h4 className="fw-bold mb-3">บริษัทที่ยื่นคำขอมา</h4>

      <div className="card shadow-sm mt-4">
        <div className="card-body p-4">
          {/* แสดงผลตามสถานะโหลด/ผิดพลาด/สำเร็จ */}
          {loading ? (
            // กำลังโหลด
            <div className="text-center mt-5"><Spinner animation="border" /></div>
          ) : error ? (
            // โหลดไม่สำเร็จ
            <Alert variant="danger" className="mt-5 text-center">{error}</Alert>
          ) : (
            // โหลดสำเร็จ → แสดงตาราง
            <div className="table-responsive">
              <Table bordered hover responsive className="text-center align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ชื่อบริษัท</th>
                    <th>อีเมล</th>
                    <th>เบอร์โทร</th>
                    <th>วันที่สมัคร</th>
                    <th>รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  {/* กรณีไม่มีคำขอใหม่ */}
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center">ไม่พบคำขอบริษัทใหม่</td>
                    </tr>
                  ) : companies.map(company => (
                    <tr key={company.company_id}>
                      {/* ข้อมูลพื้นฐานของบริษัท */}
                      <td>{company.company_name}</td>
                      <td>{company.company_email || '-'}</td>
                      <td>{company.company_phone || '-'}</td>
                      <td>{company.created_at ? new Date(company.created_at).toLocaleDateString('th-TH') : '-'}</td>
                      <td>
                        {/* ปุ่มไปหน้า “รายละเอียดบริษัท” เพื่ออนุมัติ/ปฏิเสธต่อ */}
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

export default CompanyRequestPage;
