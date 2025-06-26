// frontend/src/pages/LeaveRequestListPage.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge'; // <-- Import component ใหม่

function LeaveRequestListPage() {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/leave-requests');
            setLeaveRequests(response.data);
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ฟังก์ชันสำหรับอัปเดตสถานะ (อนุมัติ/ปฏิเสธ)
    const handleUpdateStatus = async (id, status) => {
        if (!window.confirm(`คุณแน่ใจหรือไม่ที่จะ "${status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}" คำขอนี้?`)) {
            return;
        }
        try {
            // ยิง API PATCH ที่เราสร้างไว้
            const response = await api.patch(`/leave-requests/${id}/status`, { status });
            
            // อัปเดตข้อมูลใน State โดยไม่ต้องโหลดใหม่ทั้งหมด
            setLeaveRequests(currentRequests => 
                currentRequests.map(req => 
                    req.leavework_id === id ? response.data : req
                )
            );
            alert(`อัปเดตสถานะเป็น "${status}" สำเร็จ`);
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
            console.error(err);
        }
    };
    
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH');

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">รายการคำขอลา</h4>
            <p>หน้าหลัก</p>
            <div className="table-responsive">
                <table className="table table-hover table-bordered text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ชื่อ - สกุล</th>
                            <th>ประเภทการลา</th>
                            <th>หมายเหตุ</th>
                            <th>วันที่ลา</th>
                            <th>สถานะ</th>
                            <th>ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveRequests.length > 0 ? leaveRequests.map((leave) => (
                            <tr key={leave.leavework_id}>
                                <td>{leave.emp_name}</td>
                                <td>{leave.leaveworktype_name}</td>
                                <td>{leave.leavework_description}</td>
                                <td>{formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}</td>
                                <td>
                                    <StatusBadge status={leave.leavework_status} />
                                </td>
                                <td style={{minWidth: '180px'}}>
                                    {leave.leavework_status === 'pending' ? (
                                        <div className="d-flex justify-content-center gap-2">
                                            <button onClick={() => handleUpdateStatus(leave.leavework_id, 'approved')} className="btn btn-success btn-sm">อนุมัติ</button>
                                            <button onClick={() => handleUpdateStatus(leave.leavework_id, 'rejected')} className="btn btn-danger btn-sm">ไม่อนุมัติ</button>
                                        </div>
                                    ) : (
                                        <span className="text-muted">-</span>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" className="text-center text-muted p-4">ไม่มีข้อมูลคำขอลา</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LeaveRequestListPage;