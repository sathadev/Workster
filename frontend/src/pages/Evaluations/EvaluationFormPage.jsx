// frontend/src/pages/EvaluationFormPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import EvaluationQuestion from '../../components/EvaluationQuestion';

const initialScores = { q1: '', q2: '', q3: '', q4: '', q5: '' };

function EvaluationFormPage() {
    const { empId } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [scores, setScores] = useState(initialScores);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ======================= 1. เพิ่ม State และ useEffect สำหรับตรวจสอบช่วงเวลา =======================
    const [isEvaluationPeriod, setIsEvaluationPeriod] = useState(false);

    useEffect(() => {
        const checkEvaluationPeriod = () => {
            const today = new Date();
            const month = today.getMonth(); // 0-11 (ธันวาคม คือ 11)
            const date = today.getDate();   // 1-31

            // ตรวจสอบว่าเป็นเดือนธันวาคม และวันที่ 25-31 หรือไม่
            if (month === 11 && date >= 25) {
                setIsEvaluationPeriod(true);
            } else {
                // สำหรับการทดสอบ สามารถ uncomment บรรทัดล่างเพื่อให้ประเมินได้ตลอดเวลา
                // setIsEvaluationPeriod(true);
                setIsEvaluationPeriod(false);
            }
        };

        checkEvaluationPeriod();
    }, []);
    // =============================================================================================

    // ======================= 2. ปรับ useEffect ที่ดึงข้อมูลพนักงาน =======================
    useEffect(() => {
        // ดึงข้อมูลพนักงานต่อเมื่ออยู่ในช่วงเวลาประเมินเท่านั้น
        if (isEvaluationPeriod) {
            const fetchEmployee = async () => {
                try {
                    setLoading(true);
                    const response = await api.get(`/employees/${empId}`);
                    setEmployee(response.data.employee);
                } catch (err) {
                    setError("ไม่สามารถโหลดข้อมูลพนักงานได้");
                } finally {
                    setLoading(false);
                }
            };
            fetchEmployee();
        } else {
            // ถ้าไม่อยู่ในช่วงเวลาให้หยุดโหลด เพื่อให้แสดงหน้า "นอกช่วงเวลา" ได้
            setLoading(false);
        }
    }, [empId, isEvaluationPeriod]); // เพิ่ม isEvaluationPeriod ใน dependency array
    // ====================================================================================

    const handleScoreChange = (e) => {
        setScores({ ...scores, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const evaluationData = {
                emp_id: empId,
                ...scores
            };
            await api.post('/evaluations', evaluationData);
            alert('บันทึกการประเมินผลสำเร็จ!');
            navigate('/evaluations');
        } catch (err) {
            // แสดงข้อความ error จาก backend ถ้ามี
            const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
            alert(errorMessage);
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;

    // ======================= 3. เพิ่มเงื่อนไขการแสดงผล (Conditional Rendering) =======================
    // หากไม่อยู่ในช่วงเวลาประเมิน ให้แสดงข้อความนี้
    if (!isEvaluationPeriod) {
        return (
            <div className="text-center mt-5">
                <div className="card shadow-sm mx-auto" style={{maxWidth: '500px'}}>
                    <div className="card-body p-5">
                        <h4 className="fw-bold text-danger">นอกช่วงเวลาการประเมิน</h4>
                        <p className="text-muted mt-3">
                            ระบบจะเปิดให้ประเมินพนักงานได้ในช่วงสัปดาห์สุดท้ายของเดือนธันวาคมเท่านั้น
                        </p>
                        <button onClick={() => navigate(-1)} className="btn btn-primary fw-bold px-4 mt-3">
                            กลับไปหน้าก่อนหน้า
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    // =================================================================================================

    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!employee) return <div className="alert alert-warning">ไม่พบข้อมูลพนักงาน</div>;

    // หากอยู่ในช่วงเวลาประเมิน ให้แสดงฟอร์มตามปกติ
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