// frontend/src/pages/Leavework/MyLeaveHistoryPage.jsx

// useState/useEffect สำหรับจัดการ state และ side-effect (เช่น เรียก API)
import { useState, useEffect } from 'react';
import api from '../../api/axios';                  // อินสแตนซ์ axios (ตั้งค่า baseURL/token/interceptor ไว้แล้ว)
import StatusBadge from '../../components/StatusBadge'; // แสดงป้ายสถานะ (pending / approved / rejected)
import { Link } from 'react-router-dom';            // ถ้าจะลิงก์ไปหน้าอื่นภายในแอป
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';

function MyLeaveHistoryPage() {
    // State หลัก
    const [myRequests, setMyRequests] = useState([]); // เก็บรายการคำขอลาของ "ฉัน"
    const [loading, setLoading] = useState(true);     // true ระหว่างกำลังโหลดข้อมูลจาก API
    const [error, setError] = useState(null);         // เก็บข้อความ error ถ้าโหลดล้มเหลว

    //  โหลดประวัติการลาของฉันเมื่อเข้าเพจ 
    useEffect(() => {
        const fetchMyRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                // เรียก API endpoint สำหรับดึงคำขอลาของ user ปัจจุบัน
                const response = await api.get('/leave-requests/my-requests');
                // สมมติ backend ส่ง array มาโดยตรง
                setMyRequests(response.data || []);
            } catch (err) {
                // แสดงรายละเอียด error ที่คอนโซล (ช่วยดีบัก)
                console.error("Failed to fetch my leave requests:", err.response?.data || err.message);

                // ถ้า token หมดอายุ/ไม่ได้รับอนุญาต อาจ redirect ไปหน้า login ได้
                if (err.response?.status === 401) {
                    // navigate('/login');
                }

                // แสดงข้อความแจ้งผู้ใช้
                setError("เกิดข้อผิดพลาดในการดึงประวัติการลา");
            } finally {
                setLoading(false); // ไม่ว่าจะสำเร็จ/ล้มเหลว ให้หยุดสถานะโหลด
            }
        };
        fetchMyRequests(); // เรียกใช้งานครั้งเดียวตอน mount
    }, []); // [] = ทำงานครั้งเดียวเมื่อ component ถูก mount

    // ฟังก์ชันช่วย: แปลงวันที่เป็นภาษาไทยให้อ่านง่าย 
    const formatDate = (dateString) =>
        new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

    // สถานะแสดงระหว่างโหลด/เกิดข้อผิดพลาด 
    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

    // ส่วนแสดงผล (Render) 
    return (
        <div>
            {/* หัวข้อหน้า (ขนาด h4 เพื่อให้ไม่ใหญ่เกิน) */}
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ประวัติการแจ้งลาของฉัน</h4>

            {/* ครอบตารางด้วย card + เงาเล็กน้อยให้ดูอ่านง่าย */}
            <div className="table-responsive card p-3 shadow-sm mt-4">
                {/* ตารางแสดงรายการคำขอลา */}
                <table className="table table-hover table-bordered mt-3 text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            {/* หัวตาราง: ปรับขนาดตัวอักษรและสีให้อ่านง่าย */}
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>วันที่ลา</th>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>ประเภทการลา</th>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>เหตุผล</th>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>สถานะ</th>
                        </tr>
                    </thead>

                    <tbody>
                        {/* ถ้ามีรายการคำขอ แสดงข้อมูลเป็นแถว ๆ */}
                        {myRequests.length > 0 ? myRequests.map((leave) => (
                            <tr key={leave.leavework_id}>
                                {/* วันที่: แสดงช่วงเริ่ม-สิ้นสุด โดยแปลงเป็นรูปแบบไทย */}
                                <td style={{ fontSize: '0.98rem' }}>
                                    {formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}
                                </td>

                                {/* ชนิดการลา (ชื่อที่ backend ส่งมา) */}
                                <td style={{ fontSize: '0.98rem' }}>{leave.leaveworktype_name}</td>

                                {/* เหตุผลการลา (ข้อความที่ผู้ใช้กรอก) */}
                                <td style={{ fontSize: '0.98rem' }}>{leave.leavework_description}</td>

                                {/* แสดง badge สถานะ (สี/สไตล์จัดการใน StatusBadge) */}
                                <td>
                                    <StatusBadge status={leave.leavework_status} />
                                </td>
                            </tr>
                        )) : (
                            // ถ้าไม่มีข้อมูล แสดงพื้นที่ว่างพร้อมไอคอน/ข้อความให้เข้าใจง่าย
                            <tr>
                                <td colSpan="4" className="text-center text-muted p-4">
                                    <div className="d-flex flex-column justify-content-center align-items-center">
                                        <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2"/>
                                        <span className="mb-0 text-muted" style={{ fontSize: '1.05rem' }}>
                                            ยังไม่มีการแจ้งลางาน
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MyLeaveHistoryPage;
