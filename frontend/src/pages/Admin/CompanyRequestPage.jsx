import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table, Spinner, Alert, Button } from 'react-bootstrap';
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
        <div>
            <h4 className="fw-bold mb-3">บริษัทที่ยื่นคำขอมา</h4>
           
            
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
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
