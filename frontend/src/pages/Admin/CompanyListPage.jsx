import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Spinner, Alert, Form, Button } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';

function CompanyListPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('approved');

    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/admin/companies', { params: { status: statusFilter } });
                setCompanies(res.data.data || []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, [statusFilter]);

    return (
        <div>
            <h4 className="fw-bold mb-3">ข้อมูลบริษัททั้งหมด</h4>
            
            
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    <div className="d-flex mb-3 align-items-center">
                        <label className="me-2 text-dark" style={{ fontSize: '1rem', fontWeight: 'bold' }}>สถานะ:</label>
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

                    {loading ? (
                        <div className="text-center mt-5"><Spinner animation="border" /></div>
                    ) : error ? (
                        <Alert variant="danger" className="mt-5 text-center">{error}</Alert>
                    ) : (
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
                                    {companies.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center">ไม่พบข้อมูลบริษัท</td></tr>
                                    ) : companies.map(company => (
                                        <tr key={company.company_id}>
                                            <td>{company.company_name}</td>
                                            <td>{company.company_email || '-'}</td>
                                            <td>{company.company_phone || '-'}</td>
                                            <td><StatusBadge status={company.company_status} /></td>
                                            <td>{company.created_at ? new Date(company.created_at).toLocaleDateString('th-TH') : '-'}</td>
                                            <td>
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
