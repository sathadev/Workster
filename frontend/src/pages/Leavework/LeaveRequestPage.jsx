// frontend/src/pages/Leavework/LeaveRequestPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react'; // <<<<<<< เพิ่ม useRef
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const initialFormData = {
    leaveworktype_id: '',
    leavework_datestart: '',
    leavework_end: '',
    leavework_description: '',
};

function LeaveRequestPage() {
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const textareaRef = useRef(null); // <<<<<<< สร้าง ref สำหรับ textarea

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

    // <<<<<<< useEffect สำหรับ Auto-Resize Textarea >>>>>>>
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // รีเซ็ตความสูงเพื่อคำนวณใหม่
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // ตั้งความสูงตามเนื้อหา
        }
    }, [formData.leavework_description]); // จะทำงานเมื่อค่า leavework_description เปลี่ยน
    // <<<<<<< สิ้นสุด Auto-Resize Textarea Effect >>>>>>>

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/leave-requests', formData);
            alert('ยื่นใบลาสำเร็จ!');
            setFormData(initialFormData); // รีเซ็ตฟอร์ม
        } catch (err) {
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการยื่นใบลา');
            console.error(err);
        }
    };
    
    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

    return (
        <div>
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>แจ้งขอลางาน</h4>
            

            <div className="card p-4 mb-4 shadow-sm mt-4">
                <form onSubmit={handleSubmit}>
                    <div className="row mb-3">
                        <label htmlFor="leavework_datestart" className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark" style={{ fontSize: '1rem' }}>วันที่เริ่มลา :</label>
                        <div className="col-sm-9 col-md-4">
                            <input type="date" id="leavework_datestart" name="leavework_datestart" value={formData.leavework_datestart} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="leavework_end" className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark" style={{ fontSize: '1rem' }}>วันที่สิ้นสุด :</label>
                        <div className="col-sm-9 col-md-4">
                            <input type="date" id="leavework_end" name="leavework_end" value={formData.leavework_end} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} />
                        </div>
                    </div>
                    <div className="row mb-3">
                        <label htmlFor="leaveworktype_id" className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark" style={{ fontSize: '1rem' }}>ประเภทการลา :</label>
                        <div className="col-sm-9 col-md-4">
                            <select id="leaveworktype_id" name="leaveworktype_id" value={formData.leaveworktype_id} onChange={handleChange} className="form-select" required style={{ fontSize: '1rem' }}>
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
                        <label htmlFor="leavework_description" className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark" style={{ fontSize: '1rem' }}>เหตุผลการลา :</label>
                        <div className="col-sm-9 col-md-8">
                            {/* <<<<<<< ตรงนี้คือจุดที่แก้ไข: เพิ่ม ref, ลบ rows, เพิ่ม style={{ overflow: 'hidden' }} >>>>>>> */}
                            <textarea
                                id="leavework_description"
                                name="leavework_description"
                                value={formData.leavework_description}
                                onChange={handleChange}
                                className="form-control"
                                required
                                style={{ fontSize: '1rem', overflow: 'hidden', minHeight: '120px' }} // กำหนด minHeight และซ่อน overflow
                                ref={textareaRef} // ผูก ref เข้ากับ textarea
                            ></textarea>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-sm-9 col-md-8 offset-sm-3 offset-md-2">
                            <button type="submit" className="btn btn-success" style={{ fontSize: '1.1rem' }}>ยืนยัน</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default LeaveRequestPage;