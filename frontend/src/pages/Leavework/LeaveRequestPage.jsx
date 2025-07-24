// frontend/src/pages/Leavework/LeaveRequestPage.jsx
import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
// import StatusBadge from '../../components/StatusBadge'; // <--- ลบ: ไม่จำเป็นแล้วในหน้านี้

const initialFormData = {
    leaveworktype_id: '',
    leavework_datestart: '',
    leavework_end: '',
    leavework_description: '',
};

function LeaveRequestPage() {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(true); // ยังคงใช้ loading สำหรับการโหลด leaveTypes
    const [error, setError] = useState(null);

    // Effect สำหรับดึงข้อมูลประเภทการลา (ยังคงจำเป็น)
    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                setLoading(true);
                const response = await api.get('/leave-types'); // ดึงประเภทการลา
                setLeaveTypes(response.data);
            } catch (err) {
                console.error("Failed to fetch leave types:", err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูลประเภทการลา");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaveTypes();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leave-requests', formData);
            alert('ยื่นใบลาสำเร็จ!');
            setFormData(initialFormData); // รีเซ็ตฟอร์ม
            // ไม่ต้องเรียก fetchData() อีกต่อไป เพราะไม่มีตารางประวัติในหน้านี้แล้ว
        } catch (err) {
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการยื่นใบลา');
            console.error(err);
        }
    };
    
    // const formatDate = (dateString) => new Date(dateString).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }); // <--- ลบ: ไม่จำเป็นแล้ว

    if (loading) return <div className="text-center mt-5">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">แจ้งขอลางาน</h4>
            <p>หน้าหลัก / แจ้งขอลางาน</p> {/* อัปเดต Breadcrumb */}

            <div className="card p-4 mb-4">
                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <label htmlFor="leavework_datestart" className="col-sm-3 col-md-2 col-form-label text-sm-end">วันที่เริ่มลา :</label>
                        <div className="col-sm-9 col-md-4">
                            <input type="date" id="leavework_datestart" name="leavework_datestart" value={formData.leavework_datestart} onChange={handleChange} className="form-control" required />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="leavework_end" className="col-sm-3 col-md-2 col-form-label text-sm-end">วันที่สิ้นสุด :</label>
                        <div className="col-sm-9 col-md-4">
                            <input type="date" id="leavework_end" name="leavework_end" value={formData.leavework_end} onChange={handleChange} className="form-control" required />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="leaveworktype_id" className="col-sm-3 col-md-2 col-form-label text-sm-end">ประเภทการลา :</label>
                        <div className="col-sm-9 col-md-4">
                            <select id="leaveworktype_id" name="leaveworktype_id" value={formData.leaveworktype_id} onChange={handleChange} className="form-select" required>
                                <option value="">-- เลือกประเภทการลา --</option>
                                {leaveTypes.map(type => (
                                    <option key={type.leaveworktype_id} value={type.leaveworktype_id}>
                                        {type.leaveworktype_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="leavework_description" className="col-sm-3 col-md-2 col-form-label text-sm-end">เหตุผลการลา :</label>
                        <div className="col-sm-9 col-md-6">
                            <textarea id="leavework_description" name="leavework_description" value={formData.leavework_description} onChange={handleChange} className="form-control" rows="3" required></textarea>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-9 col-md-8 offset-sm-3 offset-md-2">
                            <button type="submit" className="btn btn-success">ยืนยัน</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default LeaveRequestPage;
