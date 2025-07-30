// frontend/src/pages/EmployeeAddPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

// คุณสามารถสร้างไฟล์ CSS แยกสำหรับหน้านี้ได้ถ้าต้องการ
// import './EmployeeAddPage.css'; // หากคุณมีไฟล์นี้และต้องการใช้ styles ที่นี่

const initialFormData = {
    emp_name: '',
    jobpos_id: '',
    emp_email: '',
    emp_tel: '',
    emp_address: '',
    emp_username: '',
    emp_password: '',
    emp_birthday: '',
};

function EmployeeAddPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState(initialFormData);
    const [positions, setPositions] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('/images/profile.jpg'); // รูปเริ่มต้น
    const [error, setError] = useState(null);

    // 1. ดึงข้อมูลรายการตำแหน่งงานมาแสดงใน dropdown
    useEffect(() => {
        api.get('/positions')
            .then(res => {
                setPositions(res.data);
            })
            .catch(err => {
                console.error("Failed to fetch positions", err);
                setError("ไม่สามารถโหลดข้อมูลตำแหน่งงานได้");
            });
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setImageFile(e.target.files[0]);
            setImagePreview(URL.createObjectURL(e.target.files[0])); // แสดง preview จาก File object
        }
    };
    
    const handleReset = () => {
        setFormData(initialFormData);
        setImageFile(null);
        setImagePreview('/images/profile.jpg');
        setError(null);
    };

    // 2. ส่งข้อมูลพนักงานใหม่ไปที่ Backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        
        const dataToSubmit = new FormData();
        Object.keys(formData).forEach(key => {
            dataToSubmit.append(key, formData[key]);
        });
        
        if (imageFile) {
            // Multer ใน Backend จะรับ File object นี้แล้วจัดการเอง ไม่ต้องแปลงเป็น base64
            dataToSubmit.append('emp_pic', imageFile);
        }

        try {
            await api.post('/employees', dataToSubmit, {
                // 'multipart/form-data' เป็น Header ที่สำคัญสำหรับการอัปโหลดไฟล์
                headers: { 'Content-Type': 'multipart/form-data' } 
            });
            alert('บันทึกข้อมูลพนักงานใหม่สำเร็จ!');
            navigate('/employees');
        } catch (err) {
            const errorMessage = err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
            setError(errorMessage);
            console.error(err);
        }
    };


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '2rem' }}>เพิ่มข้อมูลพนักงาน</h4> {/* ใช้ h4 เป็น 2rem และ text-dark */}
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}> {/* ปรับขนาดและสี breadcrumb */}
                <Link to="/employees" className="text-secondary text-decoration-none link-primary-hover">พนักงาน</Link> / <span className="text-dark">เพิ่มข้อมูลพนักงาน</span>
            </p>

            <div className="card p-4 shadow-sm mt-4"> {/* เพิ่ม shadow-sm และ mt-4 */}
                <form onSubmit={handleSubmit} onReset={handleReset}>
                    <div className="row">
                        {/* ส่วนรูปโปรไฟล์ */}
                        <div className="col-md-4 d-flex justify-content-center align-items-start mb-4">
                            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                {/* src ของ img ใช้ imagePreview ซึ่งมาจาก URL.createObjectURL() แล้ว */}
                                <img src={imagePreview} alt="Profile Preview" className="rounded-circle border border-primary" style={{ width: '150px', height: '150px', objectFit: 'cover' }} /> {/* เพิ่ม border-primary */}
                                <label htmlFor="fileInput" className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ position: 'absolute', bottom: 5, right: 5, cursor: 'pointer', width: '30px', height: '30px', fontSize: '0.8rem' }}> {/* ปรับขนาดปุ่ม + */}
                                    <FontAwesomeIcon icon={faPlus} />
                                </label>
                                <input name="emp_pic" type="file" id="fileInput" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>

                        {/* ส่วนฟอร์มข้อมูล */}
                        <div className="col-md-8">
                            {error && <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>} {/* ปรับขนาด error message */}
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ชื่อ - สกุล :</label> {/* ปรับ label */}
                                <div className="col-sm-9"><input type="text" name="emp_name" value={formData.emp_name} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} /></div> {/* ปรับ input */}
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ตำแหน่ง :</label>
                                <div className="col-sm-9">
                                    <select name="jobpos_id" value={formData.jobpos_id} onChange={handleChange} className="form-select" required style={{ fontSize: '1rem' }}>
                                        <option value="">-- กรุณาเลือกตำแหน่ง --</option>
                                        {positions.map(pos => (
                                            <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Email :</label>
                                <div className="col-sm-9"><input type="email" name="emp_email" value={formData.emp_email} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} /></div>
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>เบอร์โทร :</label>
                                <div className="col-sm-9"><input type="tel" name="emp_tel" value={formData.emp_tel} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} /></div>
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ที่อยู่ :</label>
                                <div className="col-sm-9"><textarea name="emp_address" value={formData.emp_address} onChange={handleChange} className="form-control" rows="3" required style={{ fontSize: '1rem' }}></textarea></div>
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>วันเกิด :</label>
                                <div className="col-sm-9"><input type="date" name="emp_birthday" value={formData.emp_birthday} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} /></div>
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Username :</label>
                                <div className="col-sm-9"><input type="text" name="emp_username" value={formData.emp_username} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} /></div>
                            </div>
                            <div className="row mb-3">
                                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Password :</label>
                                <div className="col-sm-9"><input type="password" name="emp_password" value={formData.emp_password} onChange={handleChange} className="form-control" required style={{ fontSize: '1rem' }} /></div>
                            </div>

                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                        <button type="reset" className="btn btn-secondary me-2" style={{ fontSize: '1rem' }}>ล้างข้อมูล</button>
                        <button type="submit" className="btn btn-success" style={{ fontSize: '1rem' }}>ยืนยันการบันทึก</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default EmployeeAddPage;