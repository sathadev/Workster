// frontend/src/pages/Leavework/MyLeaveHistoryPage.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';

function MyLeaveHistoryPage() {
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effect สำหรับดึงประวัติการลาของตัวเอง
    useEffect(() => {
        const fetchMyRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                // เรียก API เพื่อดึงประวัติการลาของ user ที่ล็อกอินอยู่
                // Backend leaveworkController.js getMyLeaveRequests จะกรองตาม emp_id และ companyId ให้แล้ว
                const response = await api.get('/leave-requests/my-requests');
                setMyRequests(response.data || []);
            } catch (err) {
                console.error("Failed to fetch my leave requests:", err.response?.data || err.message);
                setError("เกิดข้อผิดพลาดในการดึงประวัติการลา");
            } finally {
                setLoading(false);
            }
        };
        fetchMyRequests();
    }, []); // Dependency array ว่างเปล่า เพราะต้องการดึงข้อมูลครั้งเดียวเมื่อ Component Mount

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">ประวัติการแจ้งลาของฉัน</h4>
            <p><Link to="/">หน้าหลัก</Link> / ประวัติการแจ้งลา</p>

            <div className="table-responsive">
                <table className="table table-hover mt-3 text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>วันที่ลา</th>
                            <th>ประเภทการลา</th>
                            <th>เหตุผล</th>
                            <th>สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myRequests.length > 0 ? myRequests.map((leave) => (
                            <tr key={leave.leavework_id}>
                                <td>{formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}</td>
                                <td>{leave.leaveworktype_name}</td>
                                <td>{leave.leavework_description}</td>
                                <td>
                                    <StatusBadge status={leave.leavework_status} />
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted p-4">
                                    <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2 d-block"/>
                                    ยังไม่มีการแจ้งลางาน
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
