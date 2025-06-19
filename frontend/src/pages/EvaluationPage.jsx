// frontend/src/pages/EvaluationPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faSearch } from '@fortawesome/free-solid-svg-icons';

function EvaluationPage() {
    const { user } = useAuth(); // ดึงข้อมูล user ที่ล็อกอินอยู่มาใช้
    const navigate = useNavigate();
    
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSelfEvalModal, setShowSelfEvalModal] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                // ดึงรายชื่อพนักงานทั้งหมด (อาจจะใช้ API เดียวกับ EmployeeList)
                const response = await api.get('/employees', { params: { limit: 200 } });
                setEmployees(response.data.data || []);
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน");
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const handleEvaluateClick = (employeeId) => {
        if (employeeId === user.emp_id) {
            // ถ้าพยายามประเมินตัวเอง ให้เปิด Modal
            setShowSelfEvalModal(true);
        } else {
            // ถ้าประเมินคนอื่น ให้ไปที่หน้าฟอร์ม
            // หมายเหตุ: เรายังไม่ได้สร้างหน้านี้ แต่ใส่ Link รอไว้ก่อน
            navigate(`/evaluations/form/${employeeId}`);
        }
    };

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">การประเมินผล</h4>
                <Link to="/evaluations/history" className="btn btn-outline-secondary">
                    <FontAwesomeIcon icon={faHistory} className="me-2" /> ประวัติการประเมิน
                </Link>
            </div>
            <p>หน้าหลัก</p>

            {/* ส่วนของตาราง */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ชื่อ - สกุล</th>
                            <th>ตำแหน่ง</th>
                            <th>การประเมินผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp) => (
                            <tr key={emp.emp_id}>
                                <td>{emp.emp_name}</td>
                                <td>{emp.jobpos_name}</td>
                                <td>
                                    <button 
                                        className="btn btn-primary rounded-pill px-3"
                                        onClick={() => handleEvaluateClick(emp.emp_id)}
                                    >
                                        ประเมินผล
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal สำหรับแจ้งเตือนเมื่อประเมินตัวเอง */}
            <Modal show={showSelfEvalModal} onHide={() => setShowSelfEvalModal(false)} centered>
                <Modal.Header closeButton className="bg-warning">
                    <Modal.Title>แจ้งเตือน</Modal.Title>
                </Modal.Header>
                <Modal.Body>คุณไม่สามารถประเมินตัวเองได้</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSelfEvalModal(false)}>
                        ปิด
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default EvaluationPage;