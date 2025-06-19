// frontend/src/pages/EvaluationResultPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import EvaluationResultItem from '../components/EvaluationResultItem';
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

    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!resultData) return <div className="alert alert-warning">ไม่พบข้อมูล</div>;

    const { evaluation, employee } = resultData;

    return (
        <div>
            <h4 className="fw-bold">การประเมินผล</h4>
            <p><Link to="/evaluations">หน้าหลัก</Link> / <Link to="/evaluations/history">ประวัติการประเมิน</Link> / ผลการประเมิน</p>

            <div className="card shadow-sm">
                <div className="card-header bg-light text-center position-relative">
                    <button onClick={() => navigate(-1)} className="btn btn-link position-absolute start-0 top-50 translate-middle-y ms-3 text-dark">
                        <FontAwesomeIcon icon={faAngleLeft} />
                    </button>
                    <h5 className="mb-0">ผลการประเมินของ: {employee.emp_name}</h5>
                </div>
                <div className="card-body px-md-5">
                    <p><strong>ตำแหน่ง:</strong> {employee.jobpos_name}</p>
                    <table className="table table-bordered align-middle">
                        <thead className="table-light">
                            <tr>
                                <th className="text-center">หัวข้อการประเมิน</th>
                                <th className="text-center" style={{ width: '120px' }}>คะแนนที่ได้</th>
                            </tr>
                        </thead>
                        <tbody>
                            <EvaluationResultItem questionNumber={1} title="ความสามารถในการเรียนรู้งาน" score={evaluation.evaluatework_score1} />
                            <EvaluationResultItem questionNumber={2} title="ข้อปฏิบัติและการปฏิบัติตามกฎ/ข้อบังคับ" score={evaluation.evaluatework_score2} />
                            <EvaluationResultItem questionNumber={3} title="ความรับผิดชอบต่องานที่ทำ" score={evaluation.evaluatework_score3} />
                            <EvaluationResultItem questionNumber={4} title="การทำงานร่วมกับผู้อื่น" score={evaluation.evaluatework_score4} />
                            <EvaluationResultItem questionNumber={5} title="ความคิดริเริ่มสร้างสรรค์" score={evaluation.evaluatework_score5} />
                        </tbody>
                        <tfoot>
                            <tr className="table-light">
                                <td className="text-end fw-bold">คะแนนรวม</td>
                                <td className="text-center fw-bold fs-5">{evaluation.evaluatework_totalscore}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default EvaluationResultPage;