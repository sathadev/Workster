// frontend/src/pages/EvaluationFormPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'react-bootstrap';
import api from '../../api/axios';
import EvaluationQuestion from '../../components/EvaluationQuestion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

// ค่าตั้งต้นของคะแนนแต่ละข้อ (q1 - q5)
const initialScores = { q1: '', q2: '', q3: '', q4: '', q5: '' };

function EvaluationFormPage() {
  // ดึง empId จากพาธ /evaluations/form/:empId
  const { empId } = useParams();
  const navigate = useNavigate();

  // สเตทหลักของหน้า
  const [employee, setEmployee] = useState(null);   // ข้อมูลพนักงานที่ถูกประเมิน
  const [scores, setScores] = useState(initialScores); // คะแนนจากแบบฟอร์ม
  const [loading, setLoading] = useState(true);     // สถานะกำลังโหลด
  const [error, setError] = useState(null);         // ข้อความผิดพลาด

  //  สถานะ “อยู่ในช่วงประเมินหรือไม่”
  const [isEvaluationPeriod, setIsEvaluationPeriod] = useState(false);

  // เช็กช่วงเวลาเปิดประเมิน (สัปดาห์สุดท้ายของเดือน ธ.ค. → วันที่ 25-31)
  useEffect(() => {
    const checkEvaluationPeriod = () => {
      const today = new Date();
      const month = today.getMonth(); // 0-11 (ธ.ค. = 11)
      const date = today.getDate();   // 1-31

      //  อนุญาตเฉพาะ 25-31 ธ.ค.
      if (month === 11 && date >= 25) {
        setIsEvaluationPeriod(true);
      } else {
        //  ถ้าอยากเปิดตลอดเพื่อทดสอบ ให้ uncomment บรรทัดด้านล่าง
        // setIsEvaluationPeriod(true);
        setIsEvaluationPeriod(false);
      }
    };

    checkEvaluationPeriod();
  }, []);

  // โหลดข้อมูลพนักงานเฉพาะเมื่อ “อยู่ในช่วงประเมิน”
  useEffect(() => {
    if (isEvaluationPeriod) {
      const fetchEmployee = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/employees/${empId}`); // ดึงข้อมูลพนักงานเป้าหมาย
          setEmployee(response.data.employee);                    // เก็บลงสเตท
        } catch (err) {
          setError("ไม่สามารถโหลดข้อมูลพนักงานได้");
        } finally {
          setLoading(false);
        }
      };
      fetchEmployee();
    } else {
      // ถ้าไม่ใช่ช่วงประเมิน ให้หยุดโหลดและแสดงการ์ดแจ้งเตือน
      setLoading(false);
    }
  }, [empId, isEvaluationPeriod]);

  // อัปเดตคะแนนเมื่อเปลี่ยนค่า select/radio ของ EvaluationQuestion
  const handleScoreChange = (e) => {
    setScores({ ...scores, [e.target.name]: e.target.value });
  };

  // submit แบบฟอร์ม: ส่ง empId + คะแนน q1..q5 ไป backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const evaluationData = {
        emp_id: empId,
        ...scores
      };
      await api.post('/evaluations', evaluationData); // POST ไปยัง API บันทึกผลประเมิน
      alert('บันทึกการประเมินผลสำเร็จ!');
      navigate('/evaluations'); // กลับไปหน้ารายการประเมิน
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      alert(errorMessage);
      console.error(err);
    }
  };

  // ระหว่างโหลด
  if (loading)
    return (
      <div className="text-center mt-5 text-muted">
        <Spinner animation="border" /> กำลังโหลด...
      </div>
    );

  // นอกช่วงประเมิน: แสดงการ์ดแจ้งเตือนและปุ่มย้อนกลับ
  if (!isEvaluationPeriod) {
    return (
      <div className="text-center mt-5">
        <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
          <div className="card-body p-5">
            <h4 className="fw-bold text-danger" style={{ fontSize: '1.8rem' }}>นอกช่วงเวลาการประเมิน</h4>
            <p className="text-secondary mt-3" style={{ fontSize: '1.05rem' }}>
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

  // โหลดพนักงานล้มเหลว
  if (error) return <div className="mt-5 text-center"><Alert variant="danger">{error}</Alert></div>;

  // ไม่พบพนักงาน
  if (!employee) return <div className="mt-5 text-center"><Alert variant="warning">ไม่พบข้อมูลพนักงาน</Alert></div>;

  // หน้าแบบฟอร์มประเมิน
  return (
    <div>
      {/* หัวข้อหน้า + ปุ่มย้อนกลับ */}
      <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>การประเมินผล</h4>
      <div className="d-flex justify-content-start align-items-center mb-3">
        <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
        </Button>
      </div>

      {/* กล่องฟอร์ม */}
      <div className="card shadow-sm mt-4">
        {/* ส่วนหัวการ์ด */}
        <div className="card-header text-center bg-gradient-primary-custom text-white py-3">
          <h5 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>แบบฟอร์มการประเมิน</h5>
        </div>

        {/* ฟอร์มส่งคะแนน */}
        <form onSubmit={handleSubmit}>
          <div className="card-body px-md-5">
            {/* แสดงข้อมูลพนักงานที่ถูกประเมิน */}
            <div className="mb-4 text-start">
              <p className="mb-1" style={{ fontSize: '1.05rem' }}>
                <strong>ชื่อ - สกุล:</strong> <span className="text-dark">{employee.emp_name}</span>
              </p>
              <p className="mb-0" style={{ fontSize: '1.05rem' }}>
                <strong>ตำแหน่ง:</strong> <span className="text-dark">{employee.jobpos_name}</span>
              </p>
            </div>

            {/* ตารางคำถามการประเมิน
                 ใช้คอมโพเนนต์ EvaluationQuestion เพื่อไม่ให้โค้ดยาวซ้ำ ๆ
                - questionNumber: เลขข้อ
                - title: หัวข้อการประเมิน
                - weight: ค่าน้ำหนัก (แสดงผล)
                - selectedValue: ค่าที่เลือกปัจจุบัน
                - onChange: ฟังก์ชันอัปเดตคะแนน */}
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th className="text-center text-dark" style={{ fontSize: '1.05rem' }}>หัวข้อการประเมิน</th>
                  <th className="text-center text-dark" style={{ width: '120px', fontSize: '1.05rem' }}>ค่าน้ำหนัก</th>
                </tr>
              </thead>
              <tbody>
                <EvaluationQuestion
                  questionNumber={1}
                  title="ความสามารถในการเรียนรู้งาน"
                  weight={20}
                  selectedValue={scores.q1}
                  onChange={handleScoreChange}
                />
                <EvaluationQuestion
                  questionNumber={2}
                  title="ข้อปฏิบัติและการปฏิบัติตามกฎ/ข้อบังคับ"
                  weight={20}
                  selectedValue={scores.q2}
                  onChange={handleScoreChange}
                />
                <EvaluationQuestion
                  questionNumber={3}
                  title="ความรับผิดชอบต่องานที่ทำ"
                  weight={20}
                  selectedValue={scores.q3}
                  onChange={handleScoreChange}
                />
                <EvaluationQuestion
                  questionNumber={4}
                  title="การทำงานร่วมกับผู้อื่น"
                  weight={20}
                  selectedValue={scores.q4}
                  onChange={handleScoreChange}
                />
                <EvaluationQuestion
                  questionNumber={5}
                  title="ความคิดริเริ่มสร้างสรรค์"
                  weight={20}
                  selectedValue={scores.q5}
                  onChange={handleScoreChange}
                />
              </tbody>
            </table>

            {/* ปุ่มบันทึก/ยกเลิก */}
            <div className="mt-4 d-flex justify-content-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/evaluations')}
                className="btn btn-secondary fw-bold px-4"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="btn btn-primary fw-bold px-4"
              >
                บันทึกข้อมูล
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EvaluationFormPage;
