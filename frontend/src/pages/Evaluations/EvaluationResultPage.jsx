// frontend/src/pages/EvaluationResultPage.jsx

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import EvaluationResultItem from '../../components/EvaluationResultItem'; // แสดงแถวผลลัพธ์รายข้อ
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';

function EvaluationResultPage() {
  const { id } = useParams();        // ดึงค่า evaluatework_id จาก URL (/evaluations/result/:id)
  const navigate = useNavigate();    // ใช้สำหรับปุ่ม “ย้อนกลับ”

  // สถานะหลักของหน้า
  const [resultData, setResultData] = useState(null); // เก็บผลรวมจาก API (evaluation + employee)
  const [loading, setLoading] = useState(true);       // แสดงสถานะกำลังโหลด
  const [error, setError] = useState(null);           // เก็บข้อความ error ถ้ามี

  // โหลดผลการประเมินจาก API ครั้งเดียวเมื่อ mount หรือเมื่อ id เปลี่ยน
  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);                                
        const response = await api.get(`/evaluations/result/${id}`);  // เรียกผลประเมินตาม id
        setResultData(response.data);                    
      } catch (err) {
        setError("ไม่สามารถโหลดข้อมูลผลการประเมินได้"); 
      } finally {
        setLoading(false);                               
      }
    };
    fetchResult();
  }, [id]);

  // สถานะต่าง ๆ ของ UI
  if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;
  if (error)   return <div className="alert alert-danger">{error}</div>;
  if (!resultData) return <div className="alert alert-warning">ไม่พบข้อมูล</div>;

  // แตกข้อมูลที่ต้องใช้ให้อ่านง่าย
  const { evaluation, employee } = resultData;

  return (
    <div>
      {/* หัวข้อหน้า */}
      <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ผลการประเมินผล</h4>

      {/* กรอบการ์ดหลัก */}
      <div className="card shadow-sm mt-4">
        {/* ส่วนหัวการ์ด: มีปุ่มย้อนกลับซ้ายมือ + ชื่อพนักงานตรงกลาง */}
        <div className="card-header bg-gradient-primary-custom text-white text-center position-relative py-3">
          {/* ปุ่มย้อนกลับ (ใช้ navigate(-1) ย้อนหน้าก่อนหน้า) */}
          <button
            onClick={() => navigate(-1)}
            className="btn btn-link position-absolute start-0 top-50 translate-middle-y ms-3 text-white"
            style={{ fontSize: '1.2rem' }}
            aria-label="ย้อนกลับ"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
          </button>

          {/* ชื่อหัวข้อ + ชื่อพนักงาน */}
          <h5 className="mb-0 fw-bold" style={{ fontSize: '1.5rem' }}>
            ผลการประเมินของ: <span className="text-white">{employee.emp_name}</span>
          </h5>
        </div>

        {/* เนื้อหาในการ์ด */}
        <div className="card-body px-md-5">
          {/* แสดงตำแหน่งงานของพนักงาน */}
          <p className="mb-4" style={{ fontSize: '1.05rem' }}>
            <strong>ตำแหน่ง:</strong> <span className="text-dark">{employee.jobpos_name}</span>
          </p>

          {/* ตารางแสดงผลคะแนนรายข้อ + คะแนนรวม */}
          <table className="table table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center text-dark" style={{ fontSize: '1.05rem' }}>หัวข้อการประเมิน</th>
                <th className="text-center text-dark" style={{ width: '120px', fontSize: '1.05rem' }}>คะแนนที่ได้</th>
              </tr>
            </thead>
            <tbody>
              {/* ใช้คอมโพเนนต์ย่อยให้โค้ดหลักสะอาด และแก้สไตล์/โครงสร้างแต่ละบรรทัดได้ง่าย */}
              <EvaluationResultItem
                questionNumber={1}
                title="ความสามารถในการเรียนรู้งาน"
                score={evaluation.evaluatework_score1}
              />
              <EvaluationResultItem
                questionNumber={2}
                title="ข้อปฏิบัติและการปฏิบัติตามกฎ/ข้อบังคับ"
                score={evaluation.evaluatework_score2}
              />
              <EvaluationResultItem
                questionNumber={3}
                title="ความรับผิดชอบต่องานที่ทำ"
                score={evaluation.evaluatework_score3}
              />
              <EvaluationResultItem
                questionNumber={4}
                title="การทำงานร่วมกับผู้อื่น"
                score={evaluation.evaluatework_score4}
              />
              <EvaluationResultItem
                questionNumber={5}
                title="ความคิดริเริ่มสร้างสรรค์"
                score={evaluation.evaluatework_score5}
              />
            </tbody>

            {/* แถวสรุปคะแนนรวม (ทำให้เด่นด้วยขนาด/สี) */}
            <tfoot>
              <tr className="table-light">
                <td className="text-end fw-bold text-dark" style={{ fontSize: '1.1rem' }}>
                  คะแนนรวม
                </td>
                <td className="text-center fw-bold text-primary fs-5" style={{ fontSize: '1.5rem' }}>
                  {evaluation.evaluatework_totalscore}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default EvaluationResultPage;
