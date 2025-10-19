// frontend/src/pages/Leavework/LeaveRequestPage.jsx

// useRef ถูกใช้เพื่ออ้างอิง DOM จริง ๆ (textarea) สำหรับทำ Auto-Resize
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/axios';          // อินสแตนซ์ axios (ตั้งค่า baseURL / interceptor ไว้แล้ว)
import { Link } from 'react-router-dom';

// ค่าตั้งต้นของฟอร์ม (กัน state ค้าง + ใช้ reset สะดวก)
const initialFormData = {
    leaveworktype_id: '',           // ประเภทการลา (เลือกจาก dropdown)
    leavework_datestart: '',        // วันที่เริ่มลา (input type="date")
    leavework_end: '',              // วันที่สิ้นสุด (input type="date")
    leavework_description: '',      // เหตุผลการลา (textarea)
};

function LeaveRequestPage() {
    // State หลัก 
    const [leaveTypes, setLeaveTypes] = useState([]);     // รายการประเภทการลา (สำหรับ select)
    const [formData, setFormData] = useState(initialFormData); // เก็บค่าฟอร์มทั้งหมด
    const [loading, setLoading] = useState(true);         // แสดงสถานะกำลังโหลดข้อมูลประเภทการลา
    const [error, setError] = useState(null);             // เก็บข้อความ error ถ้ามีปัญหาในการโหลด

    // สร้าง ref สำหรับ textarea เพื่อควบคุมความสูง (Auto-Resize)
    const textareaRef = useRef(null);

    // โหลดประเภทการลาเมื่อเปิดหน้า
    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                setLoading(true);
                // เรียก API เพื่อดึงรายการประเภทการลา (เช่น ลาป่วย, ลากิจ ฯลฯ)
                const response = await api.get('/leave-types');
                setLeaveTypes(response.data); // สมมติ backend ส่งเป็น array ตรง ๆ
            } catch (err) {
                console.error("Failed to fetch leave types:", err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูลประเภทการลา");
            } finally {
                setLoading(false);
            }
        };
        fetchLeaveTypes();
    }, []); // [] = เรียกครั้งเดียวตอน mount

    // Auto-Resize Textarea เมื่อข้อความเปลี่ยน
    useEffect(() => {
        // ถ้า textarea ถูก mount แล้ว
        if (textareaRef.current) {
            // 1) รีเซ็ตความสูงเป็น auto ก่อน เพื่อคำนวณ scrollHeight ใหม่
            textareaRef.current.style.height = 'auto';
            // 2) ตั้งความสูงตาม scrollHeight (ทำให้ textarea สูงเท่ากับเนื้อหาพอดี)
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [formData.leavework_description]); // ทำงานเมื่อผู้ใช้พิมพ์/เปลี่ยนเหตุผลการลา

    //  อัปเดตค่าในฟอร์ม 
    const handleChange = (e) => {
        // ใช้ name ของ input เป็น key แล้วอัปเดตค่าตาม value
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    //  ส่งฟอร์มไป backend 
    const handleSubmit = async (e) => {
        e.preventDefault(); // กัน reload หน้า
        try {
            // ยิง API เพื่อสร้างคำขอลาใหม่
            await api.post('/leave-requests', formData);
            alert('ยื่นใบลาสำเร็จ!');
            setFormData(initialFormData); // รีเซ็ตฟอร์มกลับเป็นค่าเริ่มต้น
            // หมายเหตุ: ถ้าอยากพากลับหน้าประวัติ/รายการ สามารถใช้ useNavigate ได้
        } catch (err) {
            // โชว์ข้อความผิดพลาดจาก backend ถ้ามี, ไม่งั้นใช้ข้อความเริ่มต้น
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการยื่นใบลา');
            console.error(err);
        }
    };
    
    //  สถานะระหว่างโหลด/ผิดพลาด
    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

    //  ส่วนแสดงผล (Render)
    return (
        <div>
            {/* หัวข้อหน้า */}
            <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>แจ้งขอลางาน</h4>

            {/* การ์ดฟอร์มกรอกคำขอลา */}
            <div className="card p-4 mb-4 shadow-sm mt-4">
                <form onSubmit={handleSubmit}>
                    {/* วันที่เริ่มลา */}
                    <div className="row mb-3">
                        <label
                            htmlFor="leavework_datestart"
                            className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark"
                            style={{ fontSize: '1rem' }}
                        >
                            วันที่เริ่มลา :
                        </label>
                        <div className="col-sm-9 col-md-4">
                            <input
                                type="date"
                                id="leavework_datestart"
                                name="leavework_datestart"
                                value={formData.leavework_datestart}
                                onChange={handleChange}
                                className="form-control"
                                required                          // บังคับกรอก
                                style={{ fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    {/* วันที่สิ้นสุด */}
                    <div className="row mb-3">
                        <label
                            htmlFor="leavework_end"
                            className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark"
                            style={{ fontSize: '1rem' }}
                        >
                            วันที่สิ้นสุด :
                        </label>
                        <div className="col-sm-9 col-md-4">
                            <input
                                type="date"
                                id="leavework_end"
                                name="leavework_end"
                                value={formData.leavework_end}
                                onChange={handleChange}
                                className="form-control"
                                required
                                style={{ fontSize: '1rem' }}
                            />
                        </div>
                    </div>

                    {/* ประเภทการลา */}
                    <div className="row mb-3">
                        <label
                            htmlFor="leaveworktype_id"
                            className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark"
                            style={{ fontSize: '1rem' }}
                        >
                            ประเภทการลา :
                        </label>
                        <div className="col-sm-9 col-md-4">
                            <select
                                id="leaveworktype_id"
                                name="leaveworktype_id"
                                value={formData.leaveworktype_id}
                                onChange={handleChange}
                                className="form-select"
                                required
                                style={{ fontSize: '1rem' }}
                            >
                                {/* ค่าเริ่มต้น ให้ผู้ใช้เลือกก่อน */}
                                <option value="">-- เลือกประเภทการลา --</option>

                                {/* วนรายการประเภทการลา จาก API */}
                                {leaveTypes.map(type => (
                                    <option
                                        key={type.leaveworktype_id}
                                        value={type.leaveworktype_id}
                                    >
                                        {type.leaveworktype_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* เหตุผลการลา (Auto-Resize Textarea) */}
                    <div className="row mb-3">
                        <label
                            htmlFor="leavework_description"
                            className="col-sm-3 col-md-2 col-form-label text-sm-end text-dark"
                            style={{ fontSize: '1rem' }}
                        >
                            เหตุผลการลา :
                        </label>
                        <div className="col-sm-9 col-md-8">
                            {/* 
                              - ผูก ref เพื่อให้ useEffect ควบคุมความสูง (auto-resize)
                              - เอา rows ออกแล้วใช้ minHeight + overflow: hidden เพื่อให้สูงเท่าข้อความ 
                            */}
                            <textarea
                                id="leavework_description"
                                name="leavework_description"
                                value={formData.leavework_description}
                                onChange={handleChange}
                                className="form-control"
                                required
                                style={{
                                    fontSize: '1rem',
                                    overflow: 'hidden',    // ซ่อนสกอลบาร์แนวตั้ง
                                    minHeight: '120px'     // ความสูงขั้นต่ำให้อ่านง่าย
                                }}
                                ref={textareaRef}          // เชื่อมกับ useRef เพื่อ auto-resize
                            ></textarea>
                        </div>
                    </div>

                    {/* ปุ่มยืนยันส่งฟอร์ม */}
                    <div className="row">
                        <div className="col-sm-9 col-md-8 offset-sm-3 offset-md-2">
                            <button
                                type="submit"
                                className="btn btn-success"
                                style={{ fontSize: '1.1rem' }}
                            >
                                ยืนยัน
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LeaveRequestPage;
