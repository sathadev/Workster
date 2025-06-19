// frontend/src/pages/EmployeeEditPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

// Helper function แปลง Buffer รูปภาพ
function arrayBufferToBase64(buffer) {
    if (!buffer || !buffer.data) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer.data);
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
}

function EmployeeEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({});
    const [positions, setPositions] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- ส่วน Logic ทั้งหมด (useEffect, handleChange, handleSubmit) ยังคงเหมือนเดิม ---
    // 1. ดึงข้อมูลพนักงานและรายการตำแหน่งงานเมื่อเปิดหน้า
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [employeeRes, positionsRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/v1/employees/${id}`),
                    axios.get('http://localhost:5000/api/v1/positions')
                ]);
                
                setFormData(employeeRes.data.employee);
                setPositions(positionsRes.data);
                
                if (employeeRes.data.employee.emp_pic) {
                    setImagePreview(`data:image/jpeg;base64,${arrayBufferToBase64(employeeRes.data.employee.emp_pic)}`);
                } else {
                    setImagePreview('/images/profile.jpg');
                }
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
            setImagePreview(URL.createObjectURL(e.target.files[0]));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = new FormData();
        // วน Loop Key ใน formData ที่เราต้องการส่ง
        ['emp_name', 'jobpos_id', 'emp_email', 'emp_tel', 'emp_address'].forEach(key => {
            dataToSubmit.append(key, formData[key]);
        });
        
        if (imageFile) {
            dataToSubmit.append('emp_pic', imageFile);
        }

        try {
            await axios.put(`http://localhost:5000/api/v1/employees/${id}`, dataToSubmit, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('อัปเดตข้อมูลสำเร็จ!');
            navigate(`/employees/view/${id}`);
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการอัปเดต');
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    // --- REFACTORED: ปรับปรุง JSX ให้เหมือนต้นฉบับ .ejs ---
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