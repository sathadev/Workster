// frontend/src/pages/PositionDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { Card, Spinner, Alert, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUserGroup, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

function PositionDetailPage() {
    const { id } = useParams();
    const [positionData, setPositionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/positions/${id}`);
                setPositionData(response.data);
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">กำลังโหลด...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger" className="mt-5 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                {error}
            </Alert>
        );
    }

    if (!positionData) {
        return (
            <Alert variant="warning" className="mt-5 text-center">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                ไม่พบข้อมูล
            </Alert>
        );
    }

    const { position, employees } = positionData;

    return (
        <div className="container py-4">
             <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดตำแหน่ง</h4> {/* ใช้ h4 เป็น 2rem และ text-dark */}
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}> {/* ปรับขนาดและสี breadcrumb */}
                <Link to="/positions" className="text-secondary text-decoration-none link-primary-hover">ตำแหน่ง</Link> / <span className="text-dark">ข้อมูลเพิ่มเติม</span>
            </p>
            <Card className="shadow-sm border-0 mt-4">
                <Card.Header style={{ backgroundColor: '#1E56A0' }} className="text-white py-3">
                    <h5 className="mb-0 fw-bold"><FontAwesomeIcon icon={faUserGroup} className="me-2" />{position.jobpos_name}</h5>
                </Card.Header>
                <Card.Body>
                    <h6 className="fw-bold mb-3">รายชื่อพนักงานในตำแหน่งนี้: {employees.length} คน</h6>
                    {employees.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">ชื่อ - สกุล</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees.map(emp => (
                                        <tr key={emp.emp_id}>
                                            <td className="ps-4">
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