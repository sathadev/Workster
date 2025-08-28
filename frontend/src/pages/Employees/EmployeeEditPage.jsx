// frontend/src/pages/EmployeeEditPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const BASE_URL_UPLOAD = 'http://localhost:5000/uploads/profile_pics/';

function EmployeeEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({});
    const [positions, setPositions] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('/images/profile.jpg');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isImageRemoved, setIsImageRemoved] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [employeeRes, positionsRes] = await Promise.all([
                    api.get(`/employees/${id}`),
                    api.get('/positions')
                ]);

                setFormData(employeeRes.data.employee);
                setPositions(positionsRes.data);

                if (employeeRes.data.employee.emp_pic) {
                    setImagePreview(`${BASE_URL_UPLOAD}${employeeRes.data.employee.emp_pic}`);
                    setIsImageRemoved(false);
                } else {
                    setImagePreview('/images/profile.jpg');
                    setIsImageRemoved(true);
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
            setIsImageRemoved(false);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('/images/profile.jpg');
        setIsImageRemoved(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const dataToSubmit = new FormData();
        ['emp_name', 'jobpos_id', 'emp_email', 'emp_tel', 'emp_address', 'emp_status', 'emp_birthday'].forEach(key => { // เพิ่ม emp_birthday
            dataToSubmit.append(key, formData[key]);
        });

        if (imageFile) {
            dataToSubmit.append('emp_pic', imageFile);
        } else if (isImageRemoved) {
            dataToSubmit.append('emp_pic_removed', 'true');
        }

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

    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>แก้ไขข้อมูลพนักงาน</h4> {/* ใช้ h4 เป็น 2rem และ text-dark */}
            </div>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}> {/* ปรับขนาดและสี breadcrumb */}
                <Link to="/employees"
                    className="text-secondary text-decoration-none link-primary-hover">พนักงาน</Link> /
                <Link to={`/employees/view/${id}`}
                    className="text-secondary text-decoration-none link-primary-hover">{formData.emp_name || '...'}</Link> /
                <span className="text-dark">แก้ไขข้อมูล</span>
            </p>

            <div className="card p-4 shadow-sm mt-4"> {/* เพิ่ม shadow-sm และ mt-4 */}
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* ส่วนรูปโปรไฟล์ */}
                        <div className="col-md-4 d-flex justify-content-center align-items-start mb-4">
                            <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                                <img src={imagePreview} alt="Profile Preview" className="rounded-circle border border-primary" style={{ width: '150px', height: '150px', objectFit: 'cover' }} /> {/* เพิ่ม border-primary */}
                                <label htmlFor="fileInput" className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center" style={{ position: 'absolute', bottom: 5, right: 5, cursor: 'pointer', width: '30px', height: '30px', fontSize: '0.8rem' }}>
                                    <FontAwesomeIcon icon={faPlus} />
                                </label>
                                <input name="emp_pic" type="file" id="fileInput" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                                {imagePreview !== '/images/profile.jpg' && !isImageRemoved && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="btn btn-danger btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ position: 'absolute', top: 5, right: 5, cursor: 'pointer', width: '30px', height: '30px', zIndex: 10, fontSize: '0.8rem' }}
                                        title="ลบรูปภาพ"
                                    >
                                        <FontAwesomeIcon icon={faTimesCircle} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* ส่วนฟอร์มข้อมูล */}
                        <div className="col-md-8">
                            <div className="row mb-3">
                                <label htmlFor="emp_name" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ชื่อ - สกุล :</label>
                                <div className="col-sm-9">
                                    <input type="text" id="emp_name" name="emp_name" value={formData.emp_name || ''} onChange={handleChange} className="form-control" style={{ fontSize: '1rem' }} />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="jobpos_id" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ตำแหน่ง :</label>
                                <div className="col-sm-9">
                                    <select id="jobpos_id" name="jobpos_id" value={formData.jobpos_id || ''} onChange={handleChange} className="form-select" style={{ fontSize: '1rem' }}>
                                        <option value="">-- กรุณาเลือกตำแหน่ง --</option>
                                        {positions.map(pos => (
                                            <option key={pos.jobpos_id} value={pos.jobpos_id}>{pos.jobpos_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_email" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Email :</label>
                                <div className="col-sm-9">
                                    <input type="email" id="emp_email" name="emp_email" value={formData.emp_email || ''} onChange={handleChange} className="form-control" style={{ fontSize: '1rem' }} />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_tel" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>เบอร์โทร :</label>
                                <div className="col-sm-9">
                                    <input type="tel" id="emp_tel" name="emp_tel" value={formData.emp_tel || ''} onChange={handleChange} className="form-control" style={{ fontSize: '1rem' }} />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_address" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1.2rem' }}>ที่อยู่ :</label>
                                <div className="col-sm-9">
                                    <textarea id="emp_address" name="emp_address" value={formData.emp_address || ''} onChange={handleChange} className="form-control" rows="3" style={{ fontSize: '1rem' }}></textarea>
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_birthday" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>วันเกิด :</label>
                                <div className="col-sm-9">
                                    <input type="date" id="emp_birthday" name="emp_birthday" value={formData.emp_birthday?.split('T')[0] || ''} onChange={handleChange} className="form-control" style={{ fontSize: '1rem' }} />
                                </div>
                            </div>
                            <div className="row mb-3">
                                <label htmlFor="emp_status" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>สถานะพนักงาน :</label>
                                <div className="col-sm-9">
                                    <select id="emp_status" name="emp_status" value={formData.emp_status || 'active'} onChange={handleChange} className="form-select" style={{ fontSize: '1rem' }}>
                                        <option value="active">ทำงานอยู่</option>
                                        <option value="resigned">ลาออกแล้ว</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                        <button type="button" onClick={() => navigate(`/employees/view/${id}`)} className="btn btn-secondary me-2" style={{ fontSize: '1rem' }}>ยกเลิก</button>
                        <button type="submit" className="btn btn-success" style={{ fontSize: '1rem' }}>ยืนยันการแก้ไข</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default EmployeeEditPage;