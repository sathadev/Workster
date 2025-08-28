// frontend/src/pages/EvaluationResultPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import EvaluationResultItem from '../../components/EvaluationResultItem'; // สมมติว่าคอมโพเนนต์นี้จัดการสไตล์ภายในได้ดี
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';

function EvaluationResultPage() {
    const { id } = useParams(); // id นี้คือ evaluatework_id
    const navigate = useNavigate();

    const [resultData, setResultData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/evaluations/result/${id}`);
                setResultData(response.data);
            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลผลการประเมินได้");
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [id]);

    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!resultData) return <div className="alert alert-warning">ไม่พบข้อมูล</div>;

    const { evaluation, employee } = resultData;

    return (
        <div>
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ผลประเมินผล</h4>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                <Link to="/evaluations" className="text-secondary text-decoration-none link-primary-hover">หน้าหลัก</Link> / <Link to="/evaluations/history" className="text-secondary text-decoration-none link-primary-hover">ประวัติการประเมิน</Link> / <span className="text-dark">ผลการประเมิน</span>
            </p>

            <div className="card shadow-sm mt-4"> {/* เพิ่ม mt-4 */}
                <div className="card-header bg-gradient-primary-custom text-white text-center position-relative py-3">
                    <button onClick={() => navigate(-1)} className="btn btn-link position-absolute start-0 top-50 translate-middle-y ms-3 text-white" style={{ fontSize: '1.2rem' }}> {/* เปลี่ยนสีปุ่มเป็น text-white */}
                        <FontAwesomeIcon icon={faAngleLeft} />
                    </button>
                    <h5 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>ผลการประเมินของ: <span className="text-white">{employee.emp_name}</span></h5> {/* เพิ่ม text-white เพื่อให้เห็นชัดเจนบน gradient */}
                </div>
                <div className="card-body px-md-5">
                    <p className="mb-4" style={{ fontSize: '1.05rem' }}><strong>ตำแหน่ง:</strong> <span className="text-dark">{employee.jobpos_name}</span></p> {/* ปรับขนาดฟอนต์ */}
                    <table className="table table-bordered align-middle">
                        <thead className="table-light">
                            <tr>
                                <th className="text-center text-dark" style={{ fontSize: '1.05rem' }}>หัวข้อการประเมิน</th>
                                <th className="text-center text-dark" style={{ width: '120px', fontSize: '1.05rem' }}>คะแนนที่ได้</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* สมมติว่า EvaluationResultItem จัดการเรื่องฟอนต์และสีภายในได้เอง */}
                            <EvaluationResultItem questionNumber={1} title="ความสามารถในการเรียนรู้งาน" score={evaluation.evaluatework_score1} />
                            <EvaluationResultItem questionNumber={2} title="ข้อปฏิบัติและการปฏิบัติตามกฎ/ข้อบังคับ" score={evaluation.evaluatework_score2} />
                            <EvaluationResultItem questionNumber={3} title="ความรับผิดชอบต่องานที่ทำ" score={evaluation.evaluatework_score3} />
                            <EvaluationResultItem questionNumber={4} title="การทำงานร่วมกับผู้อื่น" score={evaluation.evaluatework_score4} />
                            <EvaluationResultItem questionNumber={5} title="ความคิดริเริ่มสร้างสรรค์" score={evaluation.evaluatework_score5} />
                        </tbody>
                        <tfoot>
                            <tr className="table-light">
                                <td className="text-end fw-bold text-dark" style={{ fontSize: '1.1rem' }}>คะแนนรวม</td>
                                <td className="text-center fw-bold text-primary fs-5" style={{ fontSize: '1.5rem' }}>{evaluation.evaluatework_totalscore}</td> {/* เน้นสีและขนาดสำหรับคะแนนรวม */}
                            </tr>
                        </tfoot>
                    </table>
                    <div className="d-flex justify-content-center mt-4"> {/* เพิ่ม mt-4 */}
                        <button onClick={() => navigate(-1)} className="btn btn-secondary fw-bold px-4" style={{ fontSize: '1rem' }}>
                            <FontAwesomeIcon icon={faAngleLeft} className="me-2" /> กลับ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EvaluationResultPage;