// frontend/src/pages/EmployeeAddPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

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

  const [formData, setFormData] = useState(initialFormData);
  const [positions, setPositions] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('/images/profile.jpg'); // รูปเริ่มต้น
  const [error, setError] = useState(null);

  // เก็บพรีฟิลล์ที่ส่งมา (จาก navigate state หรือ localStorage)
  const [pendingPrefill, setPendingPrefill] = useState(null);
  const [appliedPrefill, setAppliedPrefill] = useState(false);

  // ---------- โหลดตำแหน่ง ----------
  useEffect(() => {
    let mounted = true;
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

  // ---------- ดึงพรีฟิลล์จาก state/localStorage ครั้งเดียว ----------
  useEffect(() => {
    // 1) จาก navigate state
    const statePrefill = location?.state?.prefill;

    // 2) จาก localStorage (สำรอง)
    let lsPrefill = null;
    try {
      const raw = localStorage.getItem('employee_prefill');
      if (raw) lsPrefill = JSON.parse(raw);
    } catch {}
    finally {
      try { localStorage.removeItem('employee_prefill'); } catch {}
    }

    const chosen = statePrefill || lsPrefill || null;
    if (chosen) setPendingPrefill(chosen);
  }, [location?.state]);

  // ---------- ฟังก์ชันช่วย ----------
  const normalize = (s) => (typeof s === 'string' ? s.trim() : '');
  const emailToUsername = (email) => {
    const e = normalize(email);
    if (!e) return '';
    const at = e.indexOf('@');
    return at > 0 ? e.slice(0, at) : e;
  };

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

  // ---------- นำพรีฟิลล์มาใส่ฟอร์ม (หลังโหลดตำแหน่งแล้ว หรือพรีฟิลล์พร้อม) ----------
  useEffect(() => {
    if (appliedPrefill) return; // ป้องกันการ override ค่าที่ผู้ใช้เริ่มกรอกแล้ว
    if (!pendingPrefill) return;

    const pf = pendingPrefill;
    const fullName =
      normalize(pf.full_name) ||
      [normalize(pf.first_name), normalize(pf.last_name)].filter(Boolean).join(' ');
    const email = normalize(pf.email);
    const phone = normalize(pf.phone);
    const jobposId = pickJobposIdFromName(pf.position_name);

    // username อัตโนมัติจากอีเมล (ถ้ามี)
    const username = emailToUsername(email);

    setFormData((prev) => ({
      ...prev,
      emp_name: fullName || prev.emp_name,
      jobpos_id: jobposId || prev.jobpos_id,
      emp_email: email || prev.emp_email,
      emp_tel: phone || prev.emp_tel,
      emp_username: username || prev.emp_username,
      // ฟิลด์อื่น ๆ ให้ผู้ใช้เติมเอง (address, password, birthday)
    }));

    setAppliedPrefill(true);
  }, [pendingPrefill, positions, appliedPrefill]);

  // ---------- จัดการอินพุต ----------
  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreview && imagePreview.startsWith('blob:')) {
      // cleanup ของเดิม
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // preview จาก File object
  };

  const handleReset = () => {
    setFormData(initialFormData);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview('/images/profile.jpg');
    setError(null);
    // ไม่แตะพรีฟิลล์ เพื่อให้ผู้ใช้กด reset แล้วพรีฟิลล์ยังอยู่ (ถ้าต้องการเคลียร์พรีฟิลล์ ให้รีเฟรชหน้า)
  };

  useEffect(() => {
    // cleanup URL object ตอน unmount
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ---------- ส่งข้อมูลไป Backend ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const dataToSubmit = new FormData();
    Object.keys(formData).forEach((key) => {
      dataToSubmit.append(key, formData[key]);
    });

    if (imageFile) {
      dataToSubmit.append('emp_pic', imageFile);
    }

    try {
      await api.post('/employees', dataToSubmit, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('บันทึกข้อมูลพนักงานใหม่สำเร็จ!');
      navigate('/employees');
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      setError(errorMessage);
      console.error(err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-dark" style={{ fontSize: '2rem' }}>เพิ่มข้อมูลพนักงาน</h4>
      </div>
      <p className="text-muted" style={{ fontSize: '0.95rem' }}>
        <Link to="/employees" className="text-secondary text-decoration-none link-primary-hover">พนักงาน</Link> / <span className="text-dark">เพิ่มข้อมูลพนักงาน</span>
      </p>

      <div className="card p-4 shadow-sm mt-4">
        <form onSubmit={handleSubmit} onReset={handleReset}>
          <div className="row">
            {/* ส่วนรูปโปรไฟล์ */}
            <div className="col-md-4 d-flex justify-content-center align-items-start mb-4">
              <div style={{ position: 'relative', width: '150px', height: '150px' }}>
                <img
                  src={imagePreview}
                  alt="Profile Preview"
                  className="rounded-circle border border-primary"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
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

            {/* ส่วนฟอร์มข้อมูล */}
            <div className="col-md-8">
              {error && <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>}

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