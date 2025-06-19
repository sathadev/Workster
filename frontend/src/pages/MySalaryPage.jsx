// frontend/src/pages/MySalaryPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SalaryDetailItem from '../components/SalaryDetailItem'; // <-- Import component ใหม่

function MySalaryPage() {
    const { user } = useAuth(); // ดึงข้อมูล user ที่ล็อกอินอยู่
    const [salaryData, setSalaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMySalary = async () => {
            if (!user) return; // ถ้ายังไม่มีข้อมูล user ให้ข้ามไปก่อน
            try {
                setLoading(true);
                const response = await api.get('/salaries/me');
                setSalaryData(response.data);
            } catch (err) {
                console.error("Failed to fetch salary data:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน");
            } finally {
                setLoading(false);
            }
        };
        fetchMySalary();
    }, [user]);

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!salaryData) return <div className="alert alert-warning">ไม่พบข้อมูลเงินเดือน</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">ดูข้อมูลเงินเดือน</h4>
            </div>
            <p>หน้าหลัก</p>
            <div className="card p-4">
                <h5 className="text-center mb-4">เงินเดือนของคุณ : {salaryData.emp_name}</h5>
                
                <SalaryDetailItem label="เงินเดือนพื้นฐาน" value={salaryData.salary_base} />
                <SalaryDetailItem label="ค่าตำแหน่ง / เบี้ยเลี้ยง" value={salaryData.salary_allowance} />
                <SalaryDetailItem label="โบนัส" value={salaryData.salary_bonus} />
                <SalaryDetailItem label="ค่าล่วงเวลา (OT)" value={salaryData.salary_ot} />
                <SalaryDetailItem label="หักเงิน" value={salaryData.salary_deduction} className="text-danger" />
                
                <hr />

                <SalaryDetailItem 
                    label="เงินเดือนสุทธิ" 
                    value={salaryData.total_salary} 
                    className="fw-bold fs-5 text-success" 
                />
            </div>
        </div>
    );
}

export default MySalaryPage;