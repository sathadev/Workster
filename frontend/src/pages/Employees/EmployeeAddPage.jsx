// frontend/src/pages/EmployeeAddPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import api from '../../api/axios';

// ค่าตั้งต้นของฟอร์มพนักงาน 
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
  const location = useLocation();

  // สเตตของหน้า
  const [formData, setFormData] = useState(initialFormData); // ข้อมูลฟอร์ม
  const [positions, setPositions] = useState([]);            // รายการตำแหน่งจาก backend
  const [imageFile, setImageFile] = useState(null);          // ไฟล์รูปภาพที่เลือก
  const [imagePreview, setImagePreview] = useState('/images/profile.jpg'); // รูปตัวอย่างเริ่มต้น
  const [error, setError] = useState(null);                  // ข้อผิดพลาดจากการ submit หรือโหลดข้อมูล

  // ตัวช่วยพรีฟิลล์ (prefill) ข้อมูล ที่อาจถูกส่งมาจากหน้าอื่นผ่าน navigate(state) หรือ localStorage
  const [pendingPrefill, setPendingPrefill] = useState(null); // เก็บ prefill ชั่วคราว
  const [appliedPrefill, setAppliedPrefill] = useState(false); // ป้องกันไม่ให้ทับค่าที่ผู้ใช้เพิ่งแก้

  // โหลด "ตำแหน่งงาน" จาก backend 
  useEffect(() => {
    let mounted = true; // ป้องกัน setState หลัง unmount
    api
      .get('/positions')
      .then((res) => {
        const arr = Array.isArray(res.data) ? res.data : [];
        if (mounted) setPositions(arr);
      })
      .catch((err) => {
        console.error('Failed to fetch positions', err);
        setError('ไม่สามารถโหลดข้อมูลตำแหน่งงานได้');
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ดึง "พรีฟิลล์" จาก navigate state หรือ localStorage
  useEffect(() => {
    // 1) prefill จาก navigate(..., { state: { prefill: {...} } })
    const statePrefill = location?.state?.prefill;

    // 2) สำรอง: prefill จาก localStorage (เช่น คัดลอกจากหน้าอื่นมาก่อน)
    let lsPrefill = null;
    try {
      const raw = localStorage.getItem('employee_prefill');
      if (raw) lsPrefill = JSON.parse(raw);
    } catch { }
    finally {
      // ใช้แล้วลบทิ้ง เพื่อไม่ให้ซ้ำในครั้งถัดไป
      try { localStorage.removeItem('employee_prefill'); } catch { }
    }

    const chosen = statePrefill || lsPrefill || null;
    if (chosen) setPendingPrefill(chosen); // เก็บไว้ก่อน รอ “ตำแหน่ง” โหลดเสร็จค่อย apply
  }, [location?.state]);

  // ฟังก์ชันช่วยทั่วไป 
  const normalize = (s) => (typeof s === 'string' ? s.trim() : '');
  // แปลง email → username (ส่วนหน้า @)
  const emailToUsername = (email) => {
    const e = normalize(email);
    if (!e) return '';
    const at = e.indexOf('@');
    return at > 0 ? e.slice(0, at) : e;
  };

  // เลือก jobpos_id จากชื่อที่อาจมาหลายชื่อ (กันกรณี backend เรียกต่างกัน)
  const pickJobposIdFromName = (posName) => {
    if (!posName || !Array.isArray(positions)) return '';
    const t = String(posName).trim().toLowerCase();

    const found = positions.find((p) => {
      const cands = [
        p.jobpos_name,
        p.position_name,
        p.position_title,
        p.title,
        p.name,
      ]
        .filter(Boolean)
        .map((x) => String(x).trim().toLowerCase());
      return cands.includes(t);
    });

    return found ? String(found.jobpos_id ?? found.id ?? '') : '';
  };

  // นำ prefill มาใส่ฟอร์ม (ครั้งเดียว) หลัง positions พร้อมแล้ว 
  useEffect(() => {
    if (appliedPrefill) return;   // เคย apply แล้ว → ไม่ทำซ้ำ
    if (!pendingPrefill) return;  // ยังไม่มี prefill → ข้าม

    const pf = pendingPrefill;
    // รองรับหลายรูปแบบชื่อ
    const fullName =
      normalize(pf.full_name) ||
      [normalize(pf.first_name), normalize(pf.last_name)].filter(Boolean).join(' ');
    const email = normalize(pf.email);
    const phone = normalize(pf.phone);
    const jobposId = pickJobposIdFromName(pf.position_name);
    const username = emailToUsername(email); // auto สร้าง username จากอีเมล

    setFormData((prev) => ({
      ...prev,
      emp_name: fullName || prev.emp_name,
      jobpos_id: jobposId || prev.jobpos_id,
      emp_email: email || prev.emp_email,
      emp_tel: phone || prev.emp_tel,
      emp_username: username || prev.emp_username,
      emp_birthday: pf.start_date || prev.emp_birthday, // ถ้า prefill มีวันที่เริ่มงาน/วันเกิด
      // ที่อยู่/รหัสผ่าน ให้ผู้ใช้กรอกเองเพื่อความถูกต้อง/ปลอดภัย
    }));

    setAppliedPrefill(true);
  }, [pendingPrefill, positions, appliedPrefill]);

  // จัดการอินพุตฟอร์ม 
  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  // จัดการไฟล์รูป + พรีวิว 
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // cleanup URL เดิม (ถ้าเป็น blob)
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // แสดงพรีวิวทันทีจากไฟล์ที่เลือก
  };

  // รีเซ็ตฟอร์ม 
  const handleReset = () => {
    setFormData(initialFormData);
    // cleanup blob URL เดิมถ้ามี
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('/images/profile.jpg');
    setError(null);
    // ไม่ลบ pendingPrefill → ถ้า user กรอกใหม่แล้ว reset ก็ยังคง prefill รอบหน้าได้
  };

  // cleanup blob URL ตอน component unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ส่งข้อมูลไป Backend 
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // ใช้ FormData เพราะมีไฟล์รูป
    const dataToSubmit = new FormData();
    Object.keys(formData).forEach((key) => {
      dataToSubmit.append(key, formData[key]);
    });

    if (imageFile) {
      dataToSubmit.append('emp_pic', imageFile); // แนบไฟล์ภาพด้วย key ที่ backend รับ
    }

    try {
      await api.post('/employees', dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('บันทึกข้อมูลพนักงานใหม่สำเร็จ!');
      navigate('/employees'); // กลับไปหน้ารายชื่อพนักงาน
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setError(errorMessage);
      console.error(err);
    }
  };

  return (
    <div>
      <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>เพิ่มข้อมูลพนักงาน</h4>

      {/* ปุ่มย้อนกลับแทน breadcrumb */}
      <div className="d-flex justify-content-start align-items-center mb-3">
        <Button variant="outline-secondary" onClick={() => navigate(-1)} style={{ fontSize: '1rem' }}>
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" /> ย้อนกลับ
        </Button>
      </div>

      {/* ฟอร์มหลัก */}
      <div className="card p-4 shadow-sm mt-4">
        <form onSubmit={handleSubmit} onReset={handleReset}>
          <div className="row">
            {/* ซ้าย: อัปโหลดรูปโปรไฟล์ + พรีวิว */}
            <div className="col-md-4 d-flex justify-content-center align-items-start mb-4">
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="rounded-circle border border-primary"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
                {/* ปุ่มรูปวงกลมเล็ก ๆ สำหรับเลือกไฟล์ */}
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
              </div>
            </div>

            {/* ขวา: ฟอร์มรายละเอียดพนักงาน */}
            <div className="col-md-8">
              {/* กล่องแจ้ง error การบันทึก */}
              {error && <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>}

              {/* ชื่อ - สกุล */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ชื่อ - สกุล :</label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    name="emp_name"
                    value={formData.emp_name}
                    onChange={handleChange}
                    className="form-control"
                    required
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* ตำแหน่ง (มาจาก API /positions) */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ตำแหน่ง :</label>
                <div className="col-sm-9">
                  <select
                    name="jobpos_id"
                    value={formData.jobpos_id}
                    onChange={handleChange}
                    className="form-select"
                    required
                    style={{ fontSize: '1rem' }}
                  >
                    <option value="">-- กรุณาเลือกตำแหน่ง --</option>
                    {positions.map((pos) => (
                      <option key={pos.jobpos_id} value={pos.jobpos_id}>
                        {pos.jobpos_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Email */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Email :</label>
                <div className="col-sm-9">
                  <input
                    type="email"
                    name="emp_email"
                    value={formData.emp_email}
                    onChange={handleChange}
                    className="form-control"
                    required
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* เบอร์โทร */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>เบอร์โทร :</label>
                <div className="col-sm-9">
                  <input
                    type="tel"
                    name="emp_tel"
                    value={formData.emp_tel}
                    onChange={handleChange}
                    className="form-control"
                    required
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* ที่อยู่ (ข้อความยาว) */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>ที่อยู่ :</label>
                <div className="col-sm-9">
                  <textarea
                    name="emp_address"
                    value={formData.emp_address}
                    onChange={handleChange}
                    className="form-control"
                    rows="3"
                    required
                    style={{ fontSize: '1rem' }}
                  ></textarea>
                </div>
              </div>

              {/* วันเกิด */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>วันเกิด :</label>
                <div className="col-sm-9">
                  <input
                    type="date"
                    name="emp_birthday"
                    value={formData.emp_birthday}
                    onChange={handleChange}
                    className="form-control"
                    required
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Username :</label>
                <div className="col-sm-9">
                  <input
                    type="text"
                    name="emp_username"
                    value={formData.emp_username}
                    onChange={handleChange}
                    className="form-control"
                    required
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="row mb-3">
                <label className="col-sm-3 col-form-label text-md-end text-dark" style={{ fontSize: '1rem' }}>Password :</label>
                <div className="col-sm-9">
                  <input
                    type="password"
                    name="emp_password"
                    value={formData.emp_password}
                    onChange={handleChange}
                    className="form-control"
                    required
                    style={{ fontSize: '1rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ปุ่มควบคุมฟอร์ม */}
          <div className="d-flex justify-content-end mt-4">
            <button type="reset" className="btn btn-secondary me-2" style={{ fontSize: '1rem' }}>
              ล้างข้อมูล
            </button>
            <button type="submit" className="btn btn-success" style={{ fontSize: '1rem' }}>
              ยืนยันการบันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default EmployeeAddPage;
