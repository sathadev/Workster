// frontend/src/pages/EvaluationFormPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import EvaluationQuestion from '../../components/EvaluationQuestion'; // <-- Import component ใหม่

const initialScores = { q1: '', q2: '', q3: '', q4: '', q5: '' };

function EvaluationFormPage() {
    const { empId } = useParams(); // รับ empId ของคนที่จะถูกประเมินจาก URL
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [scores, setScores] = useState(initialScores);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. ดึงข้อมูลของพนักงานที่จะประเมิน
    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                setLoading(true);
                // เราจะใช้ API เดิมในการดึงข้อมูลพนักงาน
                const response = await api.get(`/employees/${empId}`);
                setEmployee(response.data.employee);
            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลพนักงานได้");
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [empId]);

    const handleScoreChange = (e) => {
        setScores({ ...scores, [e.target.name]: e.target.value });
    };

    // 2. ส่งข้อมูลคะแนนไปที่ Backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const evaluationData = {
                emp_id: empId,
                ...scores
            };
            await api.post('/evaluations', evaluationData);
            alert('บันทึกการประเมินผลสำเร็จ!');
            navigate('/evaluations'); // กลับไปหน้ารายชื่อเพื่อประเมินคนต่อไป
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            console.error(err);
        }
    };

    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!employee) return <div className="alert alert-warning">ไม่พบข้อมูลพนักงาน</div>;

    return (
        <div>
            <h4 className="fw-bold">การประเมินผล</h4>
            <p><Link to="/evaluations">หน้าหลัก</Link> / แบบฟอร์มการประเมิน</p>

            <div className="card shadow-sm">
                <div className="card-header bg-light text-center">
                    <h5 className="mb-0">แบบฟอร์มการประเมิน</h5>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="card-body px-md-5">
                        <div className="mb-4 text-start">
                            <p><strong>ชื่อ - สกุล:</strong> {employee.emp_name}</p>
                            <p><strong>ตำแหน่ง:</strong> {employee.jobpos_name}</p>
                        </div>
                        <table className="table table-bordered align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th className="text-center">หัวข้อการประเมิน</th>
                                    <th className="text-center" style={{width: '120px'}}>ค่าน้ำหนัก</th>
                                </tr>
                            </thead>
                            <tbody>
                                <EvaluationQuestion questionNumber={1} title="ความสามารถในการเรียนรู้งาน" weight={20} selectedValue={scores.q1} onChange={handleScoreChange} />
                                <EvaluationQuestion questionNumber={2} title="ข้อปฏิบัติและการปฏิบัติตามกฎ/ข้อบังคับ" weight={20} selectedValue={scores.q2} onChange={handleScoreChange} />
                                <EvaluationQuestion questionNumber={3} title="ความรับผิดชอบต่องานที่ทำ" weight={20} selectedValue={scores.q3} onChange={handleScoreChange} />
                                <EvaluationQuestion questionNumber={4} title="การทำงานร่วมกับผู้อื่น" weight={20} selectedValue={scores.q4} onChange={handleScoreChange} />
                                <EvaluationQuestion questionNumber={5} title="ความคิดริเริ่มสร้างสรรค์" weight={20} selectedValue={scores.q5} onChange={handleScoreChange} />
                            </tbody>
                        </table>
                        <div className="mt-4 d-flex justify-content-center gap-3">
                            <button type="button" onClick={() => navigate('/evaluations')} className="btn btn-secondary fw-bold px-4">ยกเลิก</button>
                            <button type="submit" className="btn btn-primary fw-bold px-4">บันทึกข้อมูล</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EvaluationFormPage;