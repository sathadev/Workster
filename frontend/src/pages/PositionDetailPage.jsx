// frontend/src/pages/PositionDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

function PositionDetailPage() {
    const { id } = useParams();
    const [positionData, setPositionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/positions/${id}`);
                setPositionData(response.data);
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);
    
    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!positionData) return <div className="alert alert-warning">ไม่พบข้อมูล</div>;

    const { position, employees } = positionData;

    return (
        <div>
            <h5 className="fw-bold">ตำแหน่ง: {position.jobpos_name}</h5>
            <p><Link to="/positions">ตำแหน่ง</Link> / ข้อมูลเพิ่มเติม</p>
            <p className="fw-bold">รายชื่อพนักงานในตำแหน่งนี้</p>
            <div style={{ maxWidth: '400px' }}>
                <table className="table table-hover text-center align-middle">
                    <thead className="table-light">
                        <tr>
                            <th>ชื่อ - สกุล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length > 0 ? employees.map(emp => (
                            <tr key={emp.emp_id}>
                                <td>{emp.emp_name}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td>ไม่พบข้อมูลพนักงาน</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PositionDetailPage;