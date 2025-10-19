// frontend/src/pages/CompanyDetailPage.jsx
// หน้ารายละเอียดบริษัท (สำหรับแอดมินอนุมัติ/ไม่อนุมัติ)
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Button, Card, Spinner, Alert, Modal, Row, Col } from 'react-bootstrap';
import StatusBadge from '../../components/StatusBadge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';

function CompanyDetailPage() {
    // ดึง id บริษัทจาก URL เช่น /admin/companies/:id
    const { id } = useParams();
    const navigate = useNavigate();
    // state หลักของหน้า
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // state สำหรับการยืนยันอนุมัติ/ปฏิเสธ
    const [showConfirm, setShowConfirm] = useState(false);
    const [actionType, setActionType] = useState(null); // 'approved' | 'rejected'
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);

    // คลิกปุ่ม "อนุมัติ/ไม่อนุมัติ" → ตั้งค่า action แล้วเปิด Modal
    const handleApproveReject = (type) => {
        setActionType(type);
        setShowConfirm(true);
    };

    // กดปุ่มยืนยันใน Modal → ยิง PATCH เปลี่ยนสถานะ แล้วรีโหลดข้อมูลบริษัท
    const handleConfirm = async () => {
        setActionLoading(true);
        setActionError(null);
        try {
            await api.patch(`/admin/companies/${company.company_id}/status`, { status: actionType });
            setActionSuccess(actionType === 'approved' ? 'อนุมัติบริษัทสำเร็จ' : 'ปฏิเสธบริษัทสำเร็จ');
            // รีเฟรชข้อมูลล่าสุดหลังอัปเดตสำเร็จ
            const res = await api.get(`/admin/companies/${company.company_id}`);
            setCompany(res.data);
        } catch (err) {
            setActionError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(false);
            setShowConfirm(false);
        }
    };

    // โหลดรายละเอียดบริษัทเมื่อเปิดหน้า หรือเมื่อ id เปลี่ยน
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

    // จัดการสถานะโหลดและ error ระดับหน้า
    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center">{error}</Alert>;
    if (!company) return null;// กันกรณีโหลดเสร็จแต่ไม่มีข้อมูล

    return (
        <div>
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดบริษัท</h4>

            <Card className="shadow-sm mt-4">
                {/* เฮดเดอร์การ์ด: มีปุ่มย้อนกลับ + แสดงชื่อบริษัท */}
                <Card.Header
                    className="text-white py-3 position-relative text-center bg-gradient-primary-custom"
                >
                    <button
                        onClick={() => navigate(-1)} // กลับหน้าก่อนหน้า
                        className="btn btn-link position-absolute start-0 top-50 translate-middle-y ms-3 text-white"
                        style={{ fontSize: '1.2rem' }}
                        aria-label="ย้อนกลับ"
                    >
                        <FontAwesomeIcon icon={faAngleLeft} />
                    </button>
                    <h5 className="mb-0 fw-bold">{company.company_name}</h5>
                </Card.Header>
                <Card.Body className="px-md-5">
                    {/* แถวแสดงสถานะ + วันที่สมัคร */}
                    <Row className="mt-2">
                        <Col md={6}>
                            <p className="mb-0" style={{ fontSize: '1.05rem' }}><b>สถานะ:</b> <StatusBadge status={company.company_status} /></p>
                        </Col>
                        <Col md={6} className="text-md-end">
                            <p className="mb-0" style={{ fontSize: '1.05rem' }}>
                                <b className="text-dark">วันที่สมัคร:</b> <span className="text-muted fw-bold">{company.created_at ? new Date(company.created_at).toLocaleDateString('th-TH') : '-'}</span>
                            </p>
                        </Col>
                    </Row>

                    <hr />

                    {/* ข้อมูลติดต่อ */}
                    <div className="mb-3">
                        <p className="mb-1 fw-bold" style={{ fontSize: '1.05rem' }}>ข้อมูลติดต่อ</p>
                        <p className="text-dark mb-0" style={{ fontSize: '1.05rem' }}><b>เบอร์โทร:</b> <span className="text-muted">{company.company_phone || '-'}</span></p>
                        <p className="text-dark mb-0" style={{ fontSize: '1.05rem' }}><b>อีเมล:</b> <span className="text-muted">{company.company_email || '-'}</span></p>
                    </div>

                    {/* ที่อยู่ */}
                    <div className="mb-3">
                        <p className="mb-1 fw-bold" style={{ fontSize: '1.05rem' }}>ที่อยู่</p>
                        <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>
                            {company.company_address_number} {company.company_building} {company.company_street} {company.company_district} {company.company_province} {company.company_zip_code}
                        </p>
                    </div>

                    {/* รายละเอียดบริษัท */}
                    <div className="mb-3">
                        <p className="mb-1 fw-bold" style={{ fontSize: '1.05rem' }}>รายละเอียด</p>
                        <p className="text-muted mb-0" style={{ fontSize: '1.05rem' }}>{company.company_description || '-'}</p>
                    </div>

                    {/* ปุ่ม “อนุมัติ/ไม่อนุมัติ” แสดงเฉพาะสถานะ pending */}
                    {company.company_status === 'pending' && (
                        <div className="mt-4 text-start">
                            <Button variant="success" className="me-2" onClick={() => handleApproveReject('approved')}>อนุมัติ</Button>
                            <Button variant="danger" onClick={() => handleApproveReject('rejected')}>ไม่อนุมัติ</Button>
                        </div>
                    )}
                    {/* ข้อความผลลัพธ์การเปลี่ยนสถานะ */}
                    {actionSuccess && <Alert variant="success" className="mt-3">{actionSuccess}</Alert>}
                    {actionError && <Alert variant="danger" className="mt-3">{actionError}</Alert>}
                </Card.Body>
            </Card>

            {/* Modal ยืนยันการดำเนินการ */}
            <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>ยืนยันการ{actionType === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}บริษัท</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    คุณต้องการ{actionType === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}บริษัท <b>{company.company_name}</b> ใช่หรือไม่?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
                    <Button variant={actionType === 'approved' ? 'success' : 'danger'} 
                    onClick={handleConfirm} 
                    disabled={actionLoading} // กันกดซ้ำระหว่างกำลังส่งคำสั่ง
                    > 
                        {actionLoading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />กำลังดำเนินการ...</> : (actionType === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ')}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default CompanyDetailPage;