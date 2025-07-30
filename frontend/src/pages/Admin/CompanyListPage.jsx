import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Spinner, Alert, Form } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';

function CompanyListPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('approved'); // default เป็น approved

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
        <div className="container py-4">
            <h4 className="fw-bold mb-3">ข้อมูลบริษัททั้งหมด</h4>
            <div className="mb-3">
                <Form.Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 300 }}>
                    <option value="approved">บริษัทที่มีในระบบ (อนุมัติแล้ว)</option>
                </Form.Select>
            </div>
            {loading ? (
                <div className="text-center mt-5"><Spinner animation="border" /></div>
            ) : error ? (
                <Alert variant="danger" className="mt-5 text-center">{error}</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
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
                                    <Link to={`/admin/companies/${company.company_id}`}>ดูรายละเอียด</Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </div>
    );
}

export default CompanyListPage; 