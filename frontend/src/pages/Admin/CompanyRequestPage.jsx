import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Spinner, Alert } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';

function CompanyRequestPage() {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCompanies = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get('/admin/companies', { params: { status: 'pending' } });
                setCompanies(res.data.data || []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
            } finally {
                setLoading(false);
            }
        };
        fetchCompanies();
    }, []);

    return (
        <div className="container py-4">
            <h4 className="fw-bold mb-3">บริษัทที่ยื่นคำขอมา (รอดำเนินการ)</h4>
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
                            <th>วันที่สมัคร</th>
                            <th>รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {companies.length === 0 ? (
                            <tr><td colSpan={5} className="text-center">ไม่พบคำขอบริษัทใหม่</td></tr>
                        ) : companies.map(company => (
                            <tr key={company.company_id}>
                                <td>{company.company_name}</td>
                                <td>{company.company_email || '-'}</td>
                                <td>{company.company_phone || '-'}</td>
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

export default CompanyRequestPage; 