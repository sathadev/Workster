import { useState, useEffect } from 'react';
import api from '../../api/axios';                 //  อินสแตนซ์ axios (ตั้งค่า baseURL/interceptor ไว้แล้ว)
import { useAuth } from '../../context/AuthContext';// hook สำหรับดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
import SalaryDetailItem from '../../components/SalaryDetailItem'; // คอมโพเนนต์แสดงแถวรายละเอียดเงินเดือน (label + value)

function MySalaryPage() {
    const { user } = useAuth();                    // ข้อมูลผู้ใช้ปัจจุบัน (ถ้ายังไม่ล็อกอิน user จะเป็น null)
    const [salaryData, setSalaryData] = useState(null); // เก็บข้อมูลเงินเดือนที่ได้จาก API
    const [loading, setLoading] = useState(true);       // สถานะกำลังโหลด
    const [error, setError] = useState(null);           // ข้อความผิดพลาด (ถ้ามี)

    useEffect(() => {
        const fetchMySalary = async () => {
            if (!user) return;                     //  ถ้าไม่มี user (ยังไม่ล็อกอิน) ก็ไม่เรียก API
            try {
                setLoading(true);
                // เรียก API ที่รวม/คำนวณยอดต่าง ๆ ไว้แล้วฝั่งแบ็กเอนด์
                const response = await api.get('/salaries/me');
                setSalaryData(response.data);      // เก็บข้อมูลเพื่อนำไปแสดงผล
            } catch (err) {
                console.error("Failed to fetch salary data:", err);
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลเงินเดือน"); // แจ้งเตือนผู้ใช้
            } finally {
                setLoading(false);                 // ปิดสถานะโหลดไม่ว่าผลจะสำเร็จหรือพลาด
            }
        };
        fetchMySalary();
    }, [user]);                                     //  โหลดใหม่เมื่อสถานะ user เปลี่ยน (เช่น ล็อกอินสำเร็จ)

    // สถานะระหว่างโหลด/ผิดพลาด/ไม่มีข้อมูล 
    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!salaryData) return <div className="alert alert-warning">ไม่พบข้อมูลเงินเดือน</div>;

    //  ส่วนแสดงผลหลัก 
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">ดูข้อมูลเงินเดือน</h4> {/* 🏷️ หัวข้อหน้า */}
            </div>
           
            <div className="card p-4">
                {/* ชื่อพนักงานที่กำลังดูเงินเดือน */}
                <h5 className="text-center mb-4">เงินเดือนของคุณ : {salaryData.emp_name}</h5>
                
                {/* แสดงองค์ประกอบรายได้ต่าง ๆ */}
                <SalaryDetailItem label="เงินเดือนพื้นฐาน" value={salaryData.salary_base} />
                <SalaryDetailItem label="ค่าตำแหน่ง / เบี้ยเลี้ยง" value={salaryData.salary_allowance} />
                <SalaryDetailItem label="โบนัส" value={salaryData.salary_bonus} />
                <SalaryDetailItem label="ค่าล่วงเวลา (OT)" value={salaryData.salary_ot} />

                {/* CHANGE: ใช้ค่าที่คำนวณใหม่จากแบ็กเอนด์  */}
                {/*  salary_deduction = ยอดหักทั้งหมด (manual + auto) */}
                <SalaryDetailItem 
                    label="หักเงิน" 
                    value={salaryData.salary_deduction} 
                    className="text-danger"              //  เน้นสีแดงสำหรับยอดหัก
                />
                
                <hr />

                {/*  CHANGE: ใช้ค่าที่คำนวณใหม่จากแบ็กเอนด์  */}
                {/* total_salary = เงินเดือนสุทธิ (หลังหักทุกอย่างแล้ว) */}
                <SalaryDetailItem 
                    label="เงินเดือนสุทธิ" 
                    value={salaryData.total_salary} 
                    className="fw-bold fs-5 text-success" // เน้นตัวหนา/สีเขียวสำหรับยอดสุทธิ
                />
            </div>
        </div>
    );
}

export default MySalaryPage;
