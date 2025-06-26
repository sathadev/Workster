import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import EmployeeInfo from '../../components/EmployeeInfo'; // Import คอมโพเนนต์ EmployeeInfo ที่ถูกต้อง
import api from '../../api/axios';
import socket from '../../socket'; // Import socket
import AttendanceCards from '../../components/AttendanceCards';
import './EmployeeDetailPage.css';

function EmployeeDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true); // ใช้สำหรับ Initial Load เท่านั้น
    const [error, setError] = useState(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0); // State สำหรับกระตุ้นการโหลดใหม่จาก Socket

    // useEffect หลักสำหรับดึงข้อมูล
    // จะทำงานเมื่อ id เปลี่ยน หรือเมื่อ refetchTrigger ถูกกระตุ้นจาก Socket
    useEffect(() => {
        const fetchEmployeeDetails = async () => {
            // ตั้ง isLoading เป็น true เฉพาะตอนโหลดครั้งแรก หรือตอนเปลี่ยน ID (ถ้ายังไม่มีข้อมูล)
            if (!employeeData) {
                setLoading(true);
            }
            setError(null);
            try {
                const response = await api.get(`/employees/${id}`);
                setEmployeeData(response.data);
            } catch (err) {
                console.error("Failed to fetch employee details:", err);
                if (err.response && err.response.status === 404) {
                    setError(`ไม่พบข้อมูลพนักงาน ID: ${id}`);
                } else {
                    setError("เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์");
                }
            } finally {
                setLoading(false); // ปิดสถานะ loading เมื่อโหลดเสร็จสิ้น
            }
        };
        fetchEmployeeDetails();
    }, [id, refetchTrigger]); // Dependencies: id (เมื่อเปลี่ยนพนักงาน) และ refetchTrigger (เมื่อต้องการโหลดใหม่จาก Socket)

    // useEffect สำหรับจัดการ Socket.IO โดยเฉพาะ
    useEffect(() => {
        socket.connect(); // เชื่อมต่อ Socket

        // ฟังสัญญาณ 'employee_updated' ทั่วไป
        const handleEmployeeUpdated = (updatedEmployee) => {
            console.log(`Socket event 'employee_updated' received! Checking if it's for current employee...`, updatedEmployee);
            // ตรวจสอบว่าข้อมูลที่ถูกอัปเดตเป็นของพนักงานที่กำลังแสดงอยู่ในหน้านี้หรือไม่
            if (updatedEmployee && parseInt(updatedEmployee.emp_id) === parseInt(id)) {
                console.log(`Matching employee ID found. Triggering refetch for details of ${id}.`);
                // กระตุ้น useEffect ตัวหลักให้ทำงานใหม่ โดยไม่ set loading
                setRefetchTrigger(t => t + 1); 
            }
        };

        // เริ่มรอฟังสัญญาณจาก Server
        socket.on('employee_updated', handleEmployeeUpdated);

        // Cleanup function: ทำงานเมื่อออกจากหน้านี้ (component unmounts)
        return () => {
            socket.off('employee_updated', handleEmployeeUpdated);
            socket.disconnect();
        };
    }, [id]); // Dependency array คือ [id] เพื่อให้ Socket listener ถูกตั้งค่าใหม่เมื่อเปลี่ยนไปดูพนักงานคนอื่น

    // แสดงสถานะ Loading หรือ Error (เฉพาะในกรณี Initial Load หรือเปลี่ยน ID เท่านั้น)
    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    // กรณีที่ไม่มี employeeData แต่ไม่ error และไม่ได้กำลังโหลด (อาจจะเคยมีข้อมูลแล้วแต่ถูกลบไป)
    if (!employeeData) return <div className="alert alert-warning">ไม่พบข้อมูลพนักงาน</div>;
    
    // เมื่อโหลดข้อมูลครบถ้วนแล้ว ให้ใช้ employeeData ได้เลย
    const { employee, attendanceSummary, approvedLeaveCount } = employeeData;

    return (
        <div>
            <p><Link to="/employees">พนักงาน</Link> / {employee ? employee.emp_name : '...'}</p>
            <div className="card detail-card p-4">
                {/* แสดงข้อมูลพนักงาน หากมี */}
                {employee && <EmployeeInfo employee={employee} />}
                
                <hr className="my-4" />
                
                <h4 className="fw-bold mt-2">สรุปการทำงาน</h4>
                {/* แสดงการ์ดสรุปการทำงาน หากมี */}
                {attendanceSummary && <AttendanceCards summary={attendanceSummary} leaveCount={approvedLeaveCount || 0} />}
                
                <div className="d-flex justify-content-end mt-4">
                    {/* ปุ่มอัปเดตข้อมูลพนักงาน หากมีข้อมูลพนักงาน */}
                    {employee && <button onClick={() => navigate(`/employees/edit/${employee.emp_id}`)} className="btn btn-warning ms-2 text-white">อัพเดท</button>}
                </div>
            </div>
        </div>
    );
}

export default EmployeeDetailPage;