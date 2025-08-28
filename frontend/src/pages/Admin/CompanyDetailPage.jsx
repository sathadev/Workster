import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button, Card, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';

function CompanyDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approved' | 'rejected'
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);

    const handleApproveReject = (type) => {
        setActionType(type);
        setShowConfirm(true);
    };

    const handleConfirm = async () => {
        setActionLoading(true);
        setActionError(null);
        try {
            await api.patch(`/admin/companies/${company.company_id}/status`, { status: actionType });
            setActionSuccess(actionType === 'approved' ? 'อนุมัติบริษัทสำเร็จ' : 'ปฏิเสธบริษัทสำเร็จ');
            // รีเฟรชข้อมูลบริษัท
            const res = await api.get(`/admin/companies/${company.company_id}`);
            setCompany(res.data);
        } catch (err) {
            setActionError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(false);
            setShowConfirm(false);
        }
    };

    useEffect(() => {
        const fetchCompany = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/admin/companies/${id}`);
                setCompany(res.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
            } finally {
                setLoading(false);
            }
        };
        fetchCompany();
    }, [id]);

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center">{error}</Alert>;
    if (!company) return null;

    return (
        <div className="container py-4">
            <Button variant="secondary" className="mb-3" onClick={() => navigate(-1)}>&larr; กลับ</Button>
            <Card className="shadow-sm">
                <Card.Header style={{ backgroundColor: '#1E56A0' }} className="text-white">
                    <h5 className="mb-0 fw-bold">รายละเอียดบริษัท</h5>
                </Card.Header>
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold mb-0">{company.company_name}</h4>
                        <p className="text-muted mb-0">
                            <b>วันที่สมัคร:</b> <small>{company.created_at ? new Date(company.created_at).toLocaleDateString('th-TH') : '-'}</small>
                        </p>
                    </div>
                    <p className="text-muted mb-0"><b>สถานะ:</b> <StatusBadge status={company.company_status} /></p>

                    <hr />

                    <Row className="mb-3">
                        <Col md={12}>
                            <p className="mb-1"><b>ที่อยู่</b></p>
                            <p className="text-muted mb-0">
                                {company.company_address_number} {company.company_building} {company.company_street} {company.company_district} {company.company_province} {company.company_zip_code}
                            </p>
                        </Col>
                        <Col md={12} className="mt-3">
                            <p className="mb-1"><b>ข้อมูลติดต่อ</b></p>
                            <p className="text-muted mb-0">
                                <span className="d-block">เบอร์โทร: {company.company_phone || '-'}</span>
                                <span className="d-block">อีเมล: {company.company_email || '-'}</span>
                            </p>
                        </Col>
                    </Row>
                    
                    <div className="mb-3">
                        <p className="mb-1"><b>รายละเอียด</b></p>
                        <p className="text-muted mb-0">{company.company_description || '-'}</p>
                    </div>

                    {/* ปุ่มอนุมัติ/ไม่อนุมัติ เฉพาะ pending */}
                    {company.company_status === 'pending' && (
                        <div className="mt-4">
                            <Button variant="success" className="me-2" onClick={() => handleApproveReject('approved')}>อนุมัติ</Button>
                            <Button variant="danger" onClick={() => handleApproveReject('rejected')}>ไม่อนุมัติ</Button>
                        </div>
                    )}
                    {actionSuccess && <Alert variant="success" className="mt-3">{actionSuccess}</Alert>}
                    {actionError && <Alert variant="danger" className="mt-3">{actionError}</Alert>}
                </Card.Body>
            </Card>

            {/* Modal ยืนยันการอนุมัติ/ไม่อนุมัติ */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>ยืนยันการ{actionType === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}บริษัท</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {actionType === 'approved' ? 'คุณต้องการอนุมัติบริษัทนี้ใช่หรือไม่?' : 'คุณต้องการปฏิเสธบริษัทนี้ใช่หรือไม่?'}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
                    <Button variant={actionType === 'approved' ? 'success' : 'danger'} onClick={handleConfirm} disabled={actionLoading}>
                        {actionLoading ? 'กำลังดำเนินการ...' : (actionType === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CompanyDetailPage;