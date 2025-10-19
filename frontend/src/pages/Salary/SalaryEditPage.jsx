// frontend/src/pages/SalaryEditPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

function SalaryEditPage() {
    const { empId } = useParams(); //  รับ empId จากพารามิเตอร์ใน URL เช่น /salaries/:empId/edit
    const navigate = useNavigate(); // ใช้เปลี่ยนหน้าเมื่อบันทึกสำเร็จ/กดย้อนกลับ
    
    //  state เก็บค่าฟอร์มเงินเดือน (ค่าเริ่มต้นเป็น 0)
    const [formData, setFormData] = useState({
        salary_base: 0,
        salary_allowance: 0,
        salary_bonus: 0,
        salary_ot: 0,
        salary_deduction: 0,
    });

    const [employeeName, setEmployeeName] = useState(''); //  เก็บชื่อพนักงานเพื่อแสดงหัวฟอร์ม
    const [loading, setLoading] = useState(true);         //  แสดงสถานะกำลังโหลดข้อมูลเดิม
    const [error, setError] = useState(null);             // ข้อผิดพลาดกรณีโหลดข้อมูลไม่สำเร็จ

    // 1) ดึงข้อมูลเงินเดือนเดิมมาแสดงเมื่อเปิดหน้า/empId เปลี่ยน
    useEffect(() => {
        const fetchSalary = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/salaries/${empId}`); // เรียกข้อมูลเงินเดือนพนักงานคนนี้
                setFormData(response.data);                           // เติมค่าฟอร์มจากที่ได้มา
                setEmployeeName(response.data.emp_name);              // เซ็ตชื่อพนักงานไว้โชว์
            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลเงินเดือนได้");
            } finally {
                setLoading(false);
            }
        };
        fetchSalary();
    }, [empId]);

    //  อัปเดตค่าฟอร์มตามชื่อฟิลด์ (name) ที่เปลี่ยน
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2)  ส่งข้อมูลที่แก้ไขกลับไปอัปเดตที่ backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/salaries/${empId}`, formData); // ส่งค่าทั้งก้อนตาม model ของ backend
            alert('อัปเดตข้อมูลเงินเดือนสำเร็จ!');
            navigate('/salaries'); // กลับหน้ารายการเงินเดือนหลังบันทึก
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        }
    };

    //  สถานะระหว่างโหลด/ผิดพลาด 
    if (loading) return <div>กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    //  ส่วนแสดงผลหลัก 
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                {/* หัวข้อหน้า */}
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>แก้ไขเงินเดือน</h4>
            </div>
           
            <div className="card p-4">
                {/* โชว์ชื่อพนักงานที่กำลังแก้ไข */}
                <h5 className="text-center mb-4">แก้ไขเงินเดือน : {employeeName}</h5>

                {/* ฟอร์มแก้ไขเงินเดือน */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="salary_base" className="form-label">เงินเดือนพื้นฐาน</label>
                        <input
                            type="number" step="0.01" id="salary_base" name="salary_base"
                            className="form-control"
                            value={formData.salary_base || ''}     // กัน null/undefined
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="salary_allowance" className="form-label">ค่าตำแหน่ง / เบี้ยเลี้ยง</label>
                        <input
                            type="number" step="0.01" id="salary_allowance" name="salary_allowance"
                            className="form-control"
                            value={formData.salary_allowance || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="salary_bonus" className="form-label">โบนัส</label>
                        <input
                            type="number" step="0.01" id="salary_bonus" name="salary_bonus"
                            className="form-control"
                            value={formData.salary_bonus || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="salary_ot" className="form-label">ค่าล่วงเวลา (OT)</label>
                        <input
                            type="number" step="0.01" id="salary_ot" name="salary_ot"
                            className="form-control"
                            value={formData.salary_ot || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="salary_deduction" className="form-label">หักเงิน</label>
                        <input
                            type="number" step="0.01" id="salary_deduction" name="salary_deduction"
                            className="form-control"
                            value={formData.salary_deduction || ''}
                            onChange={handleChange}
                        />
                    </div>

                    {/* ปุ่มควบคุม: ย้อนกลับ / บันทึก */}
                    <div className="d-flex justify-content-end">
                        <button
                            type="button"
                            onClick={() => navigate('/salaries')} // กลับหน้ารายการโดยไม่บันทึก
                            className="btn btn-secondary me-2"
                        >
                            ย้อนกลับ
                        </button>
                        <button type="submit" className="btn btn-success">
                            บันทึก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SalaryEditPage;
