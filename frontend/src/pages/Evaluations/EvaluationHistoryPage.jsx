// frontend/src/pages/Evaluations/EvaluationHistoryPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faInbox } from '@fortawesome/free-solid-svg-icons';

function EvaluationHistoryPage() {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                // ดึงประวัติทั้งหมดจาก API
                const response = await api.get('/evaluations');
                setEvaluations(response.data);
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลประวัติ");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // ใช้ useMemo เพื่อกรองข้อมูลเฉพาะเมื่อ evaluations หรือ searchTerm เปลี่ยนแปลง
    const filteredEvaluations = useMemo(() => {
        if (!searchTerm) {
            return evaluations;
        }
        return evaluations.filter(evaluation =>
            evaluation.emp_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [evaluations, searchTerm]);
    
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">ประวัติการประเมินผล</h4>
            <p><Link to="/evaluations">การประเมินผล</Link> / ประวัติการประเมิน</p>
            
            {/* ฟอร์มค้นหา */}
            <div className="input-group mb-3" style={{ maxWidth: '400px' }}>
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="ค้นหาตามชื่อพนักงาน..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="input-group-text">
                    <FontAwesomeIcon icon={faSearch} />
                </span>
            </div>

            {/* ตารางแสดงข้อมูล */}
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>วันที่ประเมิน</th>
                            <th>ชื่อ - สกุล</th>
                            <th>คะแนนรวม</th>
                            <th>การประเมินผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEvaluations.length > 0 ? filteredEvaluations.map(evaluation => (
                            <tr key={evaluation.evaluatework_id}>
                                <td>{formatDate(evaluation.create_at)}</td>
                                <td>{evaluation.emp_name}</td>
                                <td>{evaluation.evaluatework_totalscore}</td>
                                <td>
                                    {/* เรายังไม่ได้สร้างหน้านี้ แต่ใส่ Link รอไว้ */}
                                    <Link to={`/evaluations/result/${evaluation.evaluatework_id}`} className="btn btn-primary rounded-pill px-3">
                                        ผลการประเมิน
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted p-4">
                                    <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default EvaluationHistoryPage;