// frontend/src/pages/PositionDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Card, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faExclamationTriangle, faInfoCircle, faAngleLeft } from '@fortawesome/free-solid-svg-icons';

function PositionDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
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
        <div>
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>รายละเอียดตำแหน่ง</h4>

            <Card className="shadow-sm border-0 mt-4">
                <Card.Header
                    className="text-white py-3 position-relative text-center bg-gradient-primary-custom"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-link position-absolute start-0 top-50 translate-middle-y ms-3 text-white"
                        style={{ fontSize: '1.2rem' }}
                        aria-label="ย้อนกลับ"
                    >
                        <FontAwesomeIcon icon={faAngleLeft} />
                    </button>
                    <h5 className="mb-0 fw-bold">
                        <FontAwesomeIcon icon={faUserGroup} className="me-2" />
                        <span className="text-white">{position.jobpos_name}</span>
                    </h5>
                </Card.Header>
                <Card.Body className="px-md-5"> {/* เพิ่ม px-md-5 เพื่อให้มีระยะห่างด้านข้างเท่ากัน */}
                    <h6 className="fw-bold mb-3 mt-4" style={{ fontSize: '1.05rem' }}>รายชื่อพนักงานในตำแหน่งนี้: <span className="text-dark fw-normal">{employees.length} คน</span></h6>
                    {employees.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4 text-dark" style={{ fontSize: '1.05rem' }}>ชื่อ - สกุล</th>
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