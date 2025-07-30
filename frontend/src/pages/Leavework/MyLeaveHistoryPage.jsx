// frontend/src/pages/Leavework/MyLeaveHistoryPage.jsx
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge'; // สมมติว่า StatusBadge จัดการสไตล์ภายในได้ดี
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';

function MyLeaveHistoryPage() {
    const [myRequests, setMyRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMyRequests = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/leave-requests/my-requests');
                setMyRequests(response.data || []);
            } catch (err) {
                console.error("Failed to fetch my leave requests:", err.response?.data || err.message);
                if (err.response?.status === 401) { // ถ้าไม่ได้รับอนุญาต (เช่น token หมดอายุ)
                    // navigate('/login'); // สามารถ redirect ไป login ได้ถ้าต้องการ
                }
                setError("เกิดข้อผิดพลาดในการดึงประวัติการลา");
            } finally {
                setLoading(false);
            }
        };
        fetchMyRequests();
    }, []);

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลดข้อมูล...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

    return (
        <div>
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ประวัติการแจ้งลาของฉัน</h4> {/* ปรับ h4 */}
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>หน้าหลัก / <span className="text-dark">ประวัติการแจ้งลา</span></p> {/* ปรับ breadcrumb */}

            <div className="table-responsive card p-3 shadow-sm mt-4"> {/* เพิ่ม card, p-3, shadow-sm, mt-4 เพื่อจัดกรอบตารางให้ดูดีขึ้น */}
                <table className="table table-hover table-bordered mt-3 text-center align-middle"> {/* เพิ่ม table-bordered */}
                    <thead className="table-light">
                        <tr>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>วันที่ลา</th> {/* ปรับ th */}
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>ประเภทการลา</th>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>เหตุผล</th>
                            <th style={{ fontSize: '1.05rem', color: '#333' }}>สถานะ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {myRequests.length > 0 ? myRequests.map((leave) => (
                            <tr key={leave.leavework_id}>
                                <td style={{ fontSize: '0.98rem' }}>{formatDate(leave.leavework_datestart)} - {formatDate(leave.leavework_end)}</td> {/* ปรับ td */}
                                <td style={{ fontSize: '0.98rem' }}>{leave.leaveworktype_name}</td>
                                <td style={{ fontSize: '0.98rem' }}>{leave.leavework_description}</td>
                                <td>
                                    <StatusBadge status={leave.leavework_status} />
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted p-4">
                                    <div className="d-flex flex-column justify-content-center align-items-center">
                                        <FontAwesomeIcon icon={faInbox} className="fa-2x mb-2"/>
                                        <span className="mb-0 text-muted" style={{ fontSize: '1.05rem' }}> {/* ปรับขนาด */}
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