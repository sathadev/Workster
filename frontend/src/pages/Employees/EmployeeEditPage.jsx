// frontend/src/pages/EmployeeEditPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimesCircle } from '@fortawesome/free-solid-svg-icons'; // เพิ่ม faTimesCircle สำหรับปุ่มลบรูป

// <--- ลบ Helper function แปลง Buffer รูปภาพ arrayBufferToBase64 ทิ้งไปเลย
// function arrayBufferToBase64(buffer) {
//     if (!buffer || !buffer.data) return '';
//     let binary = '';
//     const bytes = new Uint8Array(buffer.data);
//     for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
//     return window.btoa(binary);
// }
// --->

// กำหนด BASE_URL_UPLOAD สำหรับรูปภาพ
// ต้องตรงกับ URL ที่ Express Serve Static Files ใน app.js
const BASE_URL_UPLOAD = 'http://localhost:5000/uploads/profile_pics/'; // <--- เพิ่ม: URL สำหรับรูปภาพ

function EmployeeEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({});
    const [positions, setPositions] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('/images/profile.jpg'); // เริ่มต้นด้วยรูป default
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isImageRemoved, setIsImageRemoved] = useState(false); // <--- เพิ่ม: State สำหรับติดตามว่ารูปถูกลบหรือไม่

    // 1. ดึงข้อมูลพนักงานและรายการตำแหน่งงานเมื่อเปิดหน้า
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 2. (แก้ไข) เปลี่ยนมาใช้ 'api' ทั้งสองจุด และใช้ path สั้นๆ
                const [employeeRes, positionsRes] = await Promise.all([
                    api.get(`/employees/${id}`),
                    api.get('/positions')
                ]);
                
                setFormData(employeeRes.data.employee);
                setPositions(positionsRes.data);
                
                // <--- เปลี่ยน Logic การแสดงรูปภาพ
                if (employeeRes.data.employee.emp_pic) {
                    setImagePreview(`${BASE_URL_UPLOAD}${employeeRes.data.employee.emp_pic}`);
                    setIsImageRemoved(false); // ตั้งค่าเป็น false ถ้ามีรูป
                } else {
                    setImagePreview('/images/profile.jpg');
                    setIsImageRemoved(true); // ตั้งค่าเป็น true ถ้าไม่มีรูป
                }
                // --->
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0])); // แสดง preview จาก File object
            setIsImageRemoved(false); // เมื่อเลือกรูปใหม่ ถือว่าไม่ได้ลบรูปแล้ว
        }
    };

    // <--- เพิ่ม: ฟังก์ชันสำหรับลบรูปโปรไฟล์
    const handleRemoveImage = () => {
        setImageFile(null); // เคลียร์ไฟล์ที่เลือกไว้
        setImagePreview('/images/profile.jpg'); // แสดงรูป default
        setIsImageRemoved(true); // ตั้งค่าสถานะว่ารูปถูกลบแล้ว
    };
    // --->

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = new FormData();
        // เพิ่ม emp_status ไปด้วย เพราะอยู่ใน updateEmployee ของ backend
        ['emp_name', 'jobpos_id', 'emp_email', 'emp_tel', 'emp_address', 'emp_status'].forEach(key => { // <--- เพิ่ม 'emp_status'
            dataToSubmit.append(key, formData[key]);
        });
        
        if (imageFile) {
            dataToSubmit.append('emp_pic', imageFile); // ส่ง File object ถ้ามีการเลือกรูปใหม่
        } else if (isImageRemoved) {
            // ถ้าผู้ใช้กดปุ่มลบรูป หรือไม่มีรูปตั้งแต่แรก
            dataToSubmit.append('emp_pic_removed', 'true'); // ส่ง flag ไปบอก Backend ว่าต้องการลบรูป
        }
        // ถ้า !imageFile และ !isImageRemoved (คือไม่ได้เลือกรูปใหม่และไม่ได้กดลบรูป)
        // จะไม่ append 'emp_pic' หรือ 'emp_pic_removed' เลย
        // Backend จะใช้ค่า emp_pic เดิมจาก DB

        try {
            await api.put(`/employees/${id}`, dataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('อัปเดตข้อมูลสำเร็จ!');
            navigate(`/employees/view/${id}`);
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการอัปเดต');
            console.error(err);
        }
    };

    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">แก้ไขข้อมูลพนักงาน</h4>
            </div>
            <p>
                <Link to="/employees">พนักงาน</Link> / 
                <Link to={`/employees/view/${id}`}>{formData.emp_name || '...'}</Link> / 
                แก้ไขข้อมูล
            </p>

            <div className="card p-4">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* ส่วนรูปโปรไฟล์ */}
                        <div className="col-md-4 d-flex justify-content-center align-items-start mb-4">
                            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                <img src={imagePreview} alt="Profile Preview" className="rounded-circle border" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
                                <label htmlFor="fileInput" className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ position: 'absolute', bottom: 5, right: 5, cursor: 'pointer', width: '30px', height: '30px' }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </label>
                                <input name="emp_pic" type="file" id="fileInput" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                                {/* <--- เพิ่ม: ปุ่มลบรูปภาพ (จะแสดงเมื่อมีรูปภาพ) */}
                                {imagePreview !== '/images/profile.jpg' && !isImageRemoved && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer', width: '30px', height: '30px', zIndex: 10 }}
                                        title="ลบรูปภาพ"
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                    </button>
                                )}
                                {/* ---> */}
                            </div>
                        </div>

                        {/* ส่วนฟอร์มข้อมูล */}
                        <div className="col-md-8">
                            <div className="row mb-3">
                                <label htmlFor="emp_name" className="col-sm-3 col-form-label">ชื่อ - สกุล :</label>
                                <div className="col-sm-9">
                                    <input type="text" id="emp_name" name="emp_name" value={formData.emp_name || ''} onChange={handleChange} className="form-control" />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="jobpos_id" className="col-sm-3 col-form-label">ตำแหน่ง :</label>
                                <div className="col-sm-9">
                                    <select id="jobpos_id" name="jobpos_id" value={formData.jobpos_id || ''} onChange={handleChange} className="form-select">
                                        <option value="">-- กรุณาเลือกตำแหน่ง --</option>
                                        {positions.map(pos => (
                                            <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_email" className="col-sm-3 col-form-label">Email :</label>
                                <div className="col-sm-9">
                                    <input type="email" id="emp_email" name="emp_email" value={formData.emp_email || ''} onChange={handleChange} className="form-control" />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_tel" className="col-sm-3 col-form-label">เบอร์โทร :</label>
                                <div className="col-sm-9">
                                    <input type="tel" id="emp_tel" name="emp_tel" value={formData.emp_tel || ''} onChange={handleChange} className="form-control" />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_address" className="col-sm-3 col-form-label">ที่อยู่ :</label>
                                <div className="col-sm-9">
                                    <textarea id="emp_address" name="emp_address" value={formData.emp_address || ''} onChange={handleChange} className="form-control" rows="3"></textarea>
                                </div>
                            </div>
                            {/* <--- เพิ่ม: Field สำหรับ emp_status (ถ้ามีใน DB และต้องการแก้ไข) */}
                            <div className="row mb-3">
                                <label htmlFor="emp_status" className="col-sm-3 col-form-label">สถานะพนักงาน :</label>
                                <div className="col-sm-9">
                                    <select id="emp_status" name="emp_status" value={formData.emp_status || 'active'} onChange={handleChange} className="form-select">
                                        <option value="active">ทำงานอยู่</option>
                                        <option value="resigned">ลาออกแล้ว</option>
                                    </select>
                                </div>
                            </div>
                            {/* ---> */}
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                        <button type="button" onClick={() => navigate(`/employees/view/${id}`)} className="btn btn-secondary me-2">ยกเลิก</button>
                        <button type="submit" className="btn btn-success">ยืนยันการแก้ไข</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default EmployeeEditPage;
