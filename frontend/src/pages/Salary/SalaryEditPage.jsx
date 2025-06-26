// frontend/src/pages/Salary/SalaryEditPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';

function SalaryEditPage() {
    const { empId } = useParams(); // รับ empId จาก URL
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        salary_base: 0,
        salary_allowance: 0,
        salary_bonus: 0,
        salary_ot: 0,
        salary_deduction: 0,
    });
    const [employeeName, setEmployeeName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. ดึงข้อมูลเงินเดือนเดิมมาแสดง
    useEffect(() => {
        const fetchSalary = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/salaries/${empId}`);
                setFormData(response.data);
                setEmployeeName(response.data.emp_name);
            } catch (err) {
                setError("ไม่สามารถโหลดข้อมูลเงินเดือนได้");
            } finally {
                setLoading(false);
            }
        };
        fetchSalary();
    }, [empId]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 2. ส่งข้อมูลที่แก้ไขแล้วกลับไปอัปเดต
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/salaries/${empId}`, formData);
            alert('อัปเดตข้อมูลเงินเดือนสำเร็จ!');
            navigate('/salaries'); // กลับไปหน้ารายการเงินเดือน
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
        }
    };

    if (loading) return <div>กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">แก้ไขเงินเดือน</h4>
            <p><Link to="/salaries">จัดการเงินเดือน</Link> / แก้ไขเงินเดือน</p>

            <div className="card p-4">
                <h5 className="text-center mb-4">แก้ไขเงินเดือน : {employeeName}</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="salary_base" className="form-label">เงินเดือนพื้นฐาน</label>
                        <input type="number" step="0.01" id="salary_base" name="salary_base" className="form-control" value={formData.salary_base || ''} onChange={handleChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="salary_allowance" className="form-label">ค่าตำแหน่ง / เบี้ยเลี้ยง</label>
                        <input type="number" step="0.01" id="salary_allowance" name="salary_allowance" className="form-control" value={formData.salary_allowance || ''} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="salary_bonus" className="form-label">โบนัส</label>
                        <input type="number" step="0.01" id="salary_bonus" name="salary_bonus" className="form-control" value={formData.salary_bonus || ''} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="salary_ot" className="form-label">ค่าล่วงเวลา (OT)</label>
                        <input type="number" step="0.01" id="salary_ot" name="salary_ot" className="form-control" value={formData.salary_ot || ''} onChange={handleChange} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="salary_deduction" className="form-label">หักเงิน</label>
                        <input type="number" step="0.01" id="salary_deduction" name="salary_deduction" className="form-control" value={formData.salary_deduction || ''} onChange={handleChange} />
                    </div>
                    <div className="d-flex justify-content-end">
                        <button type="button" onClick={() => navigate('/salaries')} className="btn btn-secondary me-2">ย้อนกลับ</button>
                        <button type="submit" className="btn btn-success">บันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default SalaryEditPage;