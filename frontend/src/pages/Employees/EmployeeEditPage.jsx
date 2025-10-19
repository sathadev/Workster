// frontend/src/pages/EmployeeEditPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimesCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import api from '../../api/axios';

// โฟลเดอร์รูปโปรไฟล์จากฝั่ง backend (สำหรับแสดงพรีวิวรูปเดิมของพนักงาน)
const BASE_URL_UPLOAD = 'http://localhost:5000/uploads/profile_pics/';

function EmployeeEditPage() {
  // รับ id พนักงานจาก URL และเตรียมตัวช่วยเปลี่ยนหน้า
  const { id } = useParams();
  const navigate = useNavigate();

  // สถานะ/ข้อมูลที่ใช้ในหน้า
  const [formData, setFormData] = useState({});               // เก็บข้อมูลฟอร์มพนักงาน
  const [positions, setPositions] = useState([]);             // รายชื่อตำแหน่งจาก backend
  const [imageFile, setImageFile] = useState(null);           // ไฟล์รูปใหม่ที่ผู้ใช้เลือก
  const [imagePreview, setImagePreview] = useState('/images/profile.jpg'); // พรีวิวรูป (เดิม/ใหม่)
  const [loading, setLoading] = useState(true);               // สถานะกำลังโหลดข้อมูล
  const [error, setError] = useState(null);                   // ข้อความผิดพลาด
  const [isImageRemoved, setIsImageRemoved] = useState(false);// ผู้ใช้สั่งลบรูปออก (ใช้แจ้ง backend)

  // โหลดข้อมูล “รายละเอียดพนักงาน” + “รายการตำแหน่ง” พร้อมกัน
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ดึงข้อมูลพนักงานและตำแหน่ง “พร้อมกัน” เร็วกว่าเรียกทีละอัน
        const [employeeRes, positionsRes] = await Promise.all([
          api.get(`/employees/${id}`),
          api.get('/positions')
        ]);

        // เก็บข้อมูลฟอร์มเริ่มต้นจาก backend
        setFormData(employeeRes.data.employee);
        // เก็บรายการตำแหน่งเพื่อใช้ใน <select>
        setPositions(positionsRes.data);

        // ตั้งค่าพรีวิวรูป: ถ้ามีรูปเดิม → ชี้ไปที่โฟลเดอร์รูปของ backend, ถ้าไม่มี → ใช้รูป default
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

  // อัปเดตค่าในฟอร์มเมื่อผู้ใช้พิมพ์/เลือก
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  //  เลือกรูปใหม่ → เก็บไฟล์ + ทำ URL พรีวิวชั่วคราว
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0])); // พรีวิวจากไฟล์ blob
      setIsImageRemoved(false); // เพราะผู้ใช้เลือกไฟล์ใหม่แล้ว ไม่ถือว่า “ลบรูป”
    }
  };

  //  ลบรูปออก → รีเซ็ตเป็นรูป default + ตั้งธง isImageRemoved เพื่อแจ้ง backend ให้ลบของเก่า
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('/images/profile.jpg');
    setIsImageRemoved(true);
  };

  //  ส่งข้อมูลแก้ไขไป backend (ใช้ FormData เพราะมีไฟล์)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const dataToSubmit = new FormData();
    // ฟิลด์ที่ backend รับแน่ ๆ — ใส่ค่าให้ครบ (ไม่มีให้ส่งเป็นว่าง)
    ['emp_name', 'jobpos_id', 'emp_email', 'emp_tel', 'emp_address', 'emp_status', 'emp_birthday']
      .forEach(key => dataToSubmit.append(key, formData[key] || ''));

    // แนบไฟล์รูปใหม่ (ถ้ามี)
    if (imageFile) {
      dataToSubmit.append('emp_pic', imageFile);
    // หรือ ถ้าผู้ใช้กด “ลบรูป”
    } else if (isImageRemoved) {
      dataToSubmit.append('emp_pic_removed', 'true'); // ให้ backend รู้ว่าต้องลบรูปเดิม
    }

    try {
      await api.put(`/employees/${id}`, dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('อัปเดตข้อมูลสำเร็จ!');
      navigate(`/employees/view/${id}`); // กลับไปหน้าแสดงรายละเอียดพนักงาน
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดต');
      console.error(err);
    }
  };

  // UI ระหว่างโหลด/ผิดพลาด
  if (loading) {
    return <div className="text-center mt-5 text-muted"><Spinner animation="border" /> กำลังโหลด...</div>;
  }
  if (error) {
    return <div className="mt-5 text-center"><Alert variant="danger" style={{ fontSize: '0.95rem' }}>{error}</Alert></div>;
  }

  return (
    <div>
      {/* หัวข้อหน้า + ปุ่มย้อนกลับ */}
      <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>แก้ไขข้อมูลพนักงาน</h4>
      <div className="d-flex justify-content-start align-items-center mb-3">
        <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
        </Button>
      </div>

      {/* การ์ดฟอร์มหลัก */}
      <div className="card p-4 shadow-sm mt-4">
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* โซนอัปโหลด/จัดการรูปโปรไฟล์ */}
            <div className="col-md-4 d-flex justify-content-center align-items-start mb-4">
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                {/* พรีวิวรูป (เดิม/ใหม่) */}
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="rounded-circle border border-primary"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
                {/* ปุ่มวงกลมเล็ก ๆ มุมล่างขวา → เปิดไฟล์รูป */}
                <label
                  htmlFor="fileInput"
                  className="btn btn-primary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                  style={{ position: 'absolute', bottom: 5, right: 5, cursor: 'pointer', width: '30px', height: '30px', fontSize: '0.8rem' }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </label>
                <input
                  name="emp_pic"
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {/* ปุ่มลบรูป (มุมขวาบน) แสดงเฉพาะเมื่อมีรูปที่ไม่ใช่ default และยังไม่ถูก “ตั้งธงลบ” */}
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

            {/* ฟอร์มข้อมูลพนักงาน */}
            <div className="col-md-8">
              {/* ชื่อ - สกุล */}
              <div className="row mb-3">
                <label htmlFor="emp_name" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>
                  ชื่อ - สกุล :
                </label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    id="emp_name"
                    name="emp_name"
                    value={formData.emp_name || ''}
                    onChange={handleChange}
                    className="form-control"
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* ตำแหน่ง */}
              <div className="row mb-3">
                <label htmlFor="jobpos_id" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>
                  ตำแหน่ง :
                </label>
                <div className="col-sm-9">
                  <select
                    id="jobpos_id"
                    name="jobpos_id"
                    value={formData.jobpos_id || ''}
                    onChange={handleChange}
                    className="form-select"
                    style={{ fontSize: '1rem' }}
                  >
                    <option value="">-- กรุณาเลือกตำแหน่ง --</option>
                    {positions.map(pos => (
                      <option key={pos.jobpos_id} value={pos.jobpos_id}>
                        {pos.jobpos_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="row mb-3">
                <label htmlFor="emp_email" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>
                  Email :
                </label>
                <div className="col-sm-9">
                  <input
                    type="email"
                    id="emp_email"
                    name="emp_email"
                    value={formData.emp_email || ''}
                    onChange={handleChange}
                    className="form-control"
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* เบอร์โทร */}
              <div className="row mb-3">
                <label htmlFor="emp_tel" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>
                  เบอร์โทร :
                </label>
                <div className="col-sm-9">
                  <input
                    type="tel"
                    id="emp_tel"
                    name="emp_tel"
                    value={formData.emp_tel || ''}
                    onChange={handleChange}
                    className="form-control"
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* ที่อยู่ */}
              <div className="row mb-3">
                <label htmlFor="emp_address" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>
                  ที่อยู่ :
                </label>
                <div className="col-sm-9">
                  <textarea
                    id="emp_address"
                    name="emp_address"
                    value={formData.emp_address || ''}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    style={{ fontSize: '1rem' }}
                  ></textarea>
                </div>
              </div>

              {/* สถานะพนักงาน */}
              <div className="row mb-3">
                <label htmlFor="emp_status" className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>
                  สถานะพนักงาน :
                </label>
                <div className="col-sm-9">
                  <select
                    id="emp_status"
                    name="emp_status"
                    value={formData.emp_status || 'active'}
                    onChange={handleChange}
                    className="form-select"
                    style={{ fontSize: '1rem' }}
                  >
                    <option value="active">ทำงานอยู่</option>
                    <option value="resigned">ลาออกแล้ว</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ปุ่มควบคุมฟอร์ม */}
          <div className="d-flex justify-content-end mt-4">
            {/* ยกเลิก → กลับไปหน้าดูรายละเอียดพนักงาน */}
            <button
              type="button"
              onClick={() => navigate(`/employees/view/${id}`)}
              className="btn btn-secondary me-2"
              style={{ fontSize: '1rem' }}
            >
              ยกเลิก
            </button>
            {/* ยืนยันบันทึก */}
            <button type="submit" className="btn btn-success" style={{ fontSize: '1rem' }}>
              ยืนยันการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeEditPage;
