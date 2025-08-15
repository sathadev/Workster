// frontend/src/pages/Auth/RegisterUserPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import api from '../../api/axios';
import { Modal, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInfoCircle, faCheckCircle, faExclamationTriangle,
  faCircleUser, faSignOutAlt, faUser
} from '@fortawesome/free-solid-svg-icons';

import './RegisterUserPage.css';

function RegisterUserPage() {
  const navigate = useNavigate();

  // --- State สำหรับข้อมูลฟอร์มทั้งหมด ---
  const [formData, setFormData] = useState({
    username: '', email: '', password: '',
    fullName: '', phone: '', empAddressNo: '', empMoo: '', empBuilding: '',
    empStreet: '', empSoi: '', empSubdistrict: '', empDistrict: '',
    empProvince: '', empZipCode: '',
    companyName: '', companyAddressNo: '', companyMoo: '', companyBuilding: '',
    companyStreet: '', companySoi: '', companySubdistrict: '', companyDistrict: '',
    companyProvince: '', companyZipCode: '', companyPhone: '', companyEmail: '',
    companyDescription: '',
  });

  // --- State สำหรับ UI และการโหลดข้อมูล ---
  const [currentStep, setCurrentStep] = useState(1);
  const [thaiGeoData, setThaiGeoData] = useState([]);
  const [isLoadingGeoData, setIsLoadingGeoData] = useState(true);
  const [geoDataError, setGeoDataError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // --- States สำหรับ Dropdown Cascading ---
  const [selectedEmpProvinceId, setSelectedEmpProvinceId] = useState('');
  const [selectedEmpDistrictId, setSelectedEmpDistrictId] = useState('');
  const [selectedEmpSubdistrictId, setSelectedEmpSubdistrictId] = useState('');

  const [selectedCompanyProvinceId, setSelectedCompanyProvinceId] = useState('');
  const [selectedCompanyDistrictId, setSelectedCompanyDistrictId] = useState('');
  const [selectedCompanySubdistrictId, setSelectedCompanySubdistrictId] = useState('');

  // --- Options ---
  const empProvinceOptions = useMemo(() => {
    return thaiGeoData.map(p => ({ id: String(p.id), name_th: p.name_th }));
  }, [thaiGeoData]);

  const empDistrictOptions = useMemo(() => {
    if (!selectedEmpProvinceId) return [];
    const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedEmpProvinceId);
    return (selectedProvince?.amphure || []).map(a => ({ id: String(a.id), name_th: a.name_th }));
  }, [selectedEmpProvinceId, thaiGeoData]);

  const empSubdistrictOptions = useMemo(() => {
    if (!selectedEmpDistrictId) return [];
    const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedEmpProvinceId);
    const selectedDistrict = selectedProvince?.amphure?.find(a => String(a.id) === selectedEmpDistrictId);
    return (selectedDistrict?.tambon || []).map(t => ({ id: String(t.id), name_th: t.name_th, zip_code: t.zip_code }));
  }, [selectedEmpDistrictId, selectedEmpProvinceId, thaiGeoData]);

  const companyProvinceOptions = useMemo(() => {
    return thaiGeoData.map(p => ({ id: String(p.id), name_th: p.name_th }));
  }, [thaiGeoData]);

  const companyDistrictOptions = useMemo(() => {
    if (!selectedCompanyProvinceId) return [];
    const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedCompanyProvinceId);
    return (selectedProvince?.amphure || []).map(a => ({ id: String(a.id), name_th: a.name_th }));
  }, [selectedCompanyProvinceId, thaiGeoData]);

  const companySubdistrictOptions = useMemo(() => {
    if (!selectedCompanyDistrictId) return [];
    const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedCompanyProvinceId);
    const selectedDistrict = selectedProvince?.amphure?.find(a => String(a.id) === selectedCompanyDistrictId);
    return (selectedDistrict?.tambon || []).map(t => ({ id: String(t.id), name_th: t.name_th, zip_code: t.zip_code }));
  }, [selectedCompanyDistrictId, selectedCompanyProvinceId, thaiGeoData]);

  // --- โหลดข้อมูลจังหวัด/อำเภอ/ตำบล ---
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setThaiGeoData(data);
      } catch (error) {
        console.error('Error fetching geographical data:', error);
        setGeoDataError('ไม่สามารถโหลดข้อมูลจังหวัดได้ กรุณาลองใหม่ในภายหลัง');
      } finally {
        setIsLoadingGeoData(false);
      }
    };
    fetchGeoData();
  }, []);

  // --- Reset ID เมื่อ Options เปลี่ยน (emp) ---
  useEffect(() => {
    if (selectedEmpDistrictId && !empDistrictOptions.some(d => d.id === selectedEmpDistrictId)) {
      setSelectedEmpDistrictId('');
      setFormData(prev => ({ ...prev, empDistrict: '', empSubdistrict: '', empZipCode: '' }));
    }
    if (selectedEmpSubdistrictId && !empSubdistrictOptions.some(t => t.id === selectedEmpSubdistrictId)) {
      setSelectedEmpSubdistrictId('');
      setFormData(prev => ({ ...prev, empSubdistrict: '', empZipCode: '' }));
    }
  }, [empDistrictOptions, empSubdistrictOptions, selectedEmpDistrictId, selectedEmpSubdistrictId]);

  // --- Reset ID เมื่อ Options เปลี่ยน (company) ---
  useEffect(() => {
    if (selectedCompanyDistrictId && !companyDistrictOptions.some(d => d.id === selectedCompanyDistrictId)) {
      setSelectedCompanyDistrictId('');
      setFormData(prev => ({ ...prev, companyDistrict: '', companySubdistrict: '', companyZipCode: '' }));
    }
    if (selectedCompanySubdistrictId && !companySubdistrictOptions.some(t => t.id === selectedCompanySubdistrictId)) {
      setSelectedCompanySubdistrictId('');
      setFormData(prev => ({ ...prev, companySubdistrict: '', companyZipCode: '' }));
    }
  }, [companyDistrictOptions, companySubdistrictOptions, selectedCompanyDistrictId, selectedCompanySubdistrictId]);

  // --- Handlers ---
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEmpAddressSelectChange = (e) => {
    const { name, value } = e.target;
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({ ...prev, [name]: selectedText }));

    if (name === 'empProvince') {
      setSelectedEmpProvinceId(value);
      setSelectedEmpDistrictId('');
      setSelectedEmpSubdistrictId('');
      setFormData(prev => ({ ...prev, empDistrict: '', empSubdistrict: '', empZipCode: '' }));
    } else if (name === 'empDistrict') {
      setSelectedEmpDistrictId(value);
      setSelectedEmpSubdistrictId('');
      setFormData(prev => ({ ...prev, empSubdistrict: '', empZipCode: '' }));
    } else if (name === 'empSubdistrict') {
      setSelectedEmpSubdistrictId(value);
      const selectedSubdistrictObj = empSubdistrictOptions.find(t => t.id === value);
      setFormData(prev => ({ ...prev, empZipCode: selectedSubdistrictObj ? selectedSubdistrictObj.zip_code : '' }));
    }
  };

  const handleCompanyAddressSelectChange = (e) => {
    const { name, value } = e.target;
    const selectedText = e.target.options[e.target.selectedIndex].text;
    setFormData(prev => ({ ...prev, [name]: selectedText }));

    if (name === 'companyProvince') {
      setSelectedCompanyProvinceId(value);
      setSelectedCompanyDistrictId('');
      setSelectedCompanySubdistrictId('');
      setFormData(prev => ({ ...prev, companyDistrict: '', companySubdistrict: '', companyZipCode: '' }));
    } else if (name === 'companyDistrict') {
      setSelectedCompanyDistrictId(value);
      setSelectedCompanySubdistrictId('');
      setFormData(prev => ({ ...prev, companySubdistrict: '', companyZipCode: '' }));
    } else if (name === 'companySubdistrict') {
      setSelectedCompanySubdistrictId(value);
      const selectedSubdistrictObj = companySubdistrictOptions.find(t => t.id === value);
      setFormData(prev => ({ ...prev, companyZipCode: selectedSubdistrictObj ? selectedSubdistrictObj.zip_code : '' }));
    }
  };

  const handleNextStep = useCallback(() => {
    setFormError(null);
    let isValid = true;

    if (currentStep === 1) {
      if (!formData.username || !formData.email || !formData.password) {
        isValid = false;
        setFormError('กรุณากรอก Username, Email และ Password ให้ครบถ้วน');
      }
    } else if (currentStep === 2) {
      if (!formData.fullName || !formData.phone ||
          !formData.empAddressNo || !formData.empSubdistrict ||
          !formData.empDistrict || !formData.empProvince || !formData.empZipCode) {
        isValid = false;
        setFormError('กรุณากรอกข้อมูลชื่อ, เบอร์โทร และที่อยู่ของพนักงานให้ครบถ้วน');
      }
    }

    if (isValid) setCurrentStep(prev => prev + 1);
  }, [currentStep, formData]);

  const handlePreviousStep = useCallback(() => {
    setFormError(null);
    setCurrentStep(prev => prev - 1);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    if (!formData.companyName || !formData.companySubdistrict || !formData.companyDistrict || !formData.companyProvince || !formData.companyZipCode ||
        !formData.fullName || !formData.phone || !formData.empAddressNo || !formData.empSubdistrict || !formData.empDistrict || !formData.empProvince || !formData.empZipCode ||
        !formData.username || !formData.email || !formData.password) {
      setFormError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง');
      setIsSubmitting(false);
      return;
    }

    try {
      const emp_address_string = [
        formData.empAddressNo,
        formData.empMoo ? `หมู่ ${formData.empMoo}` : '',
        formData.empBuilding,
        formData.empStreet,
        formData.empSoi,
        formData.empSubdistrict,
        formData.empDistrict,
        formData.empProvince,
        formData.empZipCode
      ].filter(Boolean).join(' ');

      const combinedPayload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        phone: formData.phone,
        empAddressNo: formData.empAddressNo,
        empMoo: formData.empMoo,
        empBuilding: formData.empBuilding,
        empStreet: formData.empStreet,
        empSoi: formData.empSoi,
        empSubdistrict: formData.empSubdistrict,
        empDistrict: formData.empDistrict,
        empProvince: formData.empProvince,
        empZipCode: formData.empZipCode,

        companyName: formData.companyName,
        companyAddressNo: formData.companyAddressNo,
        companyMoo: formData.companyMoo,
        companyBuilding: formData.companyBuilding,
        companyStreet: formData.companyStreet,
        companySoi: formData.companySoi,
        companySubdistrict: formData.companySubdistrict,
        companyDistrict: formData.companyDistrict,
        companyProvince: formData.companyProvince,
        companyZipCode: formData.companyZipCode,
        companyPhone: formData.companyPhone,
        companyEmail: formData.companyEmail,
        companyDescription: formData.companyDescription,
      };

      console.log('Sending combined public registration payload:', combinedPayload);
      const response = await api.post('/auth/public-register-company-admin', combinedPayload);

      console.log('Registration successful:', response.data);
      setFormError(null);
      setShowSuccessModal(true);
      setTimeout(() => { navigate('/login'); }, 2000);

    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message || err);
      setFormError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสมัคร กรุณาลองอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI Loading / Error ---
  if (isLoadingGeoData) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">กำลังโหลดข้อมูลภูมิศาสตร์...</span>
        </Spinner>
        <p className="mt-2">กำลังโหลดข้อมูลภูมิศาสตร์...</p>
      </div>
    );
  }

  if (geoDataError) {
    return (
      <Alert variant="danger" className="m-4 text-center">
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        {geoDataError}
      </Alert>
    );
  }

  // --- โทนสี/สไตล์ให้เหมือน Landing ---
  return (
    <>
      <style>{`
        :root{
          --ws-primary:#1E56A0;
          --ws-accent:#3E8DCF;
          --ws-text:#333333;
          --ws-muted:#6c757d;
          --ws-shadow:0 10px 30px rgba(0,0,0,0.08);
          --ws-shadow-lg:0 15px 40px rgba(0,0,0,0.12);
          --ws-radius-lg:0.75rem;
          --ws-radius-md:0.5rem;
        }
        body{font-family:'Noto Sans Thai', sans-serif}
        .ws-navbar{background-color:#212529}
        .ws-hero{
          background:linear-gradient(90deg,var(--ws-primary),var(--ws-accent));
          color:#fff; padding:4.5rem 0 3.5rem; text-align:center;
        }
        .ws-hero .title{font-size:2.2rem; font-weight:700; text-shadow:2px 2px 4px rgba(0,0,0,.25)}
        .ws-hero .subtitle{opacity:.95; max-width:920px; margin:0.75rem auto 0}
        .ws-card{
          border:none; border-radius:var(--ws-radius-lg);
          box-shadow:var(--ws-shadow);
        }
        .ws-card .card-title{font-weight:700; color:var(--ws-primary)}
        .ws-btn{
          border-radius:999px; padding:.65rem 1.25rem; font-weight:600;
          transition:transform .15s ease, box-shadow .15s ease;
        }
        .ws-btn:hover{transform:translateY(-1px); box-shadow:0 8px 22px rgba(0,0,0,.12)}
        .ws-btn-primary{background:#007bff; border-color:#007bff}
        .ws-btn-primary:hover{background:#0056b3; border-color:#0056b3}
        .ws-btn-outline{border:2px solid var(--ws-primary); color:var(--ws-primary); background:transparent}
        .ws-btn-outline:hover{background:var(--ws-primary); color:#fff}
        .ws-stepper{
          display:flex; gap:.75rem; justify-content:center; align-items:center; margin:-2.25rem auto 2rem;
          position:relative; z-index:2;
        }
        .ws-step{
          display:flex; align-items:center; gap:.5rem;
          background:#fff; color:var(--ws-text);
          padding:.5rem .85rem; border-radius:999px; box-shadow:var(--ws-shadow);
          font-weight:600; font-size:.95rem;
        }
        .ws-step.active{background:var(--ws-primary); color:#fff}
        .ws-section{padding:2rem 0 3rem}
        .form-label-custom{font-weight:600}
        .row-custom{margin-bottom:1rem}
        .ws-required::after{content:" *"; color:#dc3545}
        @media(max-width:768px){
          .ws-hero{padding:3.5rem 0 2.5rem}
          .ws-hero .title{font-size:1.85rem}
        }
      `}</style>

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark ws-navbar sticky-top">
        <div className="container">
          <NavLink className="navbar-brand" to="/" aria-label="WorkSter Home">WorkSter</NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#regNav" aria-controls="regNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="regNav" className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item me-lg-2">
                <NavLink to="/login" className="btn btn-outline-light ws-btn">เข้าสู่ระบบ</NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="ws-hero">
        <div className="container">
          <h1 className="title">สมัครบัญชีผู้ใช้ / บริษัท</h1>
          <p className="subtitle">
            สร้างบัญชีผู้ดูแลระบบบริษัทของคุณ เพื่อเริ่มใช้งาน WorkSter — ระบบ HRM ครบวงจร
          </p>
        </div>
      </section>

      {/* Stepper */}
      <div className="ws-stepper container">
        <div className={`ws-step ${currentStep === 1 ? 'active' : ''}`}>
          <span>1</span><span>บัญชีเข้าใช้</span>
        </div>
        <div className={`ws-step ${currentStep === 2 ? 'active' : ''}`}>
          <span>2</span><span>ข้อมูลผู้ใช้</span>
        </div>
        <div className={`ws-step ${currentStep === 3 ? 'active' : ''}`}>
          <span>3</span><span>ข้อมูลบริษัท</span>
        </div>
      </div>

      {/* Section */}
      <section className="ws-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7">

              {formError && (
                <Alert variant="danger" className="mb-3">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  {formError}
                </Alert>
              )}

              {currentStep === 1 && (
                <div className="card ws-card p-3 p-md-4">
                  <h5 className="card-title mb-3">ขั้นตอนที่ 1: ข้อมูลการเข้าใช้งานระบบ</h5>
                  <Form>
                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="username" className="form-label-custom ws-required">Username</Form.Label>
                      <Form.Control type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="email" className="form-label-custom ws-required">Email</Form.Label>
                      <Form.Control type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="password" className="form-label-custom ws-required">Password</Form.Label>
                      <Form.Control type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                    </Form.Group>
                    <div className="d-flex justify-content-end mt-3">
                      <Button variant="primary" className="ws-btn ws-btn-primary" onClick={handleNextStep}>
                        ถัดไป
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {currentStep === 2 && (
                <div className="card ws-card p-3 p-md-4">
                  <h5 className="card-title mb-3">ขั้นตอนที่ 2: ข้อมูลผู้ใช้</h5>
                  <Form>
                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="fullName" className="form-label-custom ws-required">ชื่อ - นามสกุล</Form.Label>
                      <Form.Control type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="phone" className="form-label-custom ws-required">เบอร์โทร</Form.Label>
                      <Form.Control type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </Form.Group>

                    <hr className="my-3" />
                    <h6 className="mb-3" style={{ color: 'var(--ws-primary)', fontWeight: 700 }}>ข้อมูลที่อยู่</h6>

                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="empAddressNo" className="form-label-custom ws-required">เลขที่</Form.Label>
                      <Form.Control type="text" id="empAddressNo" name="empAddressNo" value={formData.empAddressNo} onChange={handleChange} required />
                    </Form.Group>
                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empMoo" className="form-label-custom">หมู่</Form.Label>
                          <Form.Control type="text" id="empMoo" name="empMoo" value={formData.empMoo} onChange={handleChange} />
                        </Form.Group>
                      </div>
                      <div className="col-md-8">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empBuilding" className="form-label-custom">อาคาร/หมู่บ้าน</Form.Label>
                          <Form.Control type="text" id="empBuilding" name="empBuilding" value={formData.empBuilding} onChange={handleChange} />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empStreet" className="form-label-custom">ถนน</Form.Label>
                          <Form.Control type="text" id="empStreet" name="empStreet" value={formData.empStreet} onChange={handleChange} />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empSoi" className="form-label-custom">ซอย</Form.Label>
                          <Form.Control type="text" id="empSoi" name="empSoi" value={formData.empSoi} onChange={handleChange} />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empProvince" className="form-label-custom ws-required">จังหวัด</Form.Label>
                          <Form.Select id="empProvince" name="empProvince" value={selectedEmpProvinceId} onChange={handleEmpAddressSelectChange} required>
                            <option value="">เลือกจังหวัด</option>
                            {empProvinceOptions.map(p => (
                              <option key={p.id} value={String(p.id)}>{p.name_th}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empDistrict" className="form-label-custom ws-required">อำเภอ/เขต</Form.Label>
                          <Form.Select
                            key={selectedEmpProvinceId}
                            id="empDistrict"
                            name="empDistrict"
                            value={selectedEmpDistrictId}
                            onChange={handleEmpAddressSelectChange}
                            required
                            disabled={!selectedEmpProvinceId}
                          >
                            <option value="">เลือกอำเภอ/เขต</option>
                            {empDistrictOptions.map(d => (
                              <option key={d.id} value={String(d.id)}>{d.name_th}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="empSubdistrict" className="form-label-custom ws-required">ตำบล/แขวง</Form.Label>
                          <Form.Select
                            key={selectedEmpDistrictId}
                            id="empSubdistrict"
                            name="empSubdistrict"
                            value={selectedEmpSubdistrictId}
                            onChange={handleEmpAddressSelectChange}
                            required
                            disabled={!selectedEmpDistrictId}
                          >
                            <option value="">เลือกตำบล/แขวง</option>
                            {empSubdistrictOptions.map(t => (
                              <option key={t.id} value={String(t.id)}>{t.name_th}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                    </div>

                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="empZipCode" className="form-label-custom ws-required">รหัสไปรษณีย์</Form.Label>
                      <Form.Control type="text" id="empZipCode" name="empZipCode" value={formData.empZipCode} readOnly />
                    </Form.Group>

                    <div className="d-flex justify-content-between mt-3">
                      <Button variant="light" className="ws-btn ws-btn-outline border-0" onClick={handlePreviousStep}>
                        ย้อนกลับ
                      </Button>
                      <Button variant="primary" className="ws-btn ws-btn-primary" onClick={handleNextStep}>
                        ถัดไป
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {currentStep === 3 && (
                <div className="card ws-card p-3 p-md-4">
                  <h5 className="card-title mb-3">ขั้นตอนที่ 3: ข้อมูลบริษัท</h5>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="companyName" className="form-label-custom ws-required">ชื่อบริษัท</Form.Label>
                      <Form.Control type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
                    </Form.Group>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyAddressNo" className="form-label-custom">เลขที่</Form.Label>
                          <Form.Control type="text" id="companyAddressNo" name="companyAddressNo" value={formData.companyAddressNo} onChange={handleChange} />
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyMoo" className="form-label-custom">หมู่</Form.Label>
                          <Form.Control type="text" id="companyMoo" name="companyMoo" value={formData.companyMoo} onChange={handleChange} />
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyBuilding" className="form-label-custom">อาคาร/หมู่บ้าน</Form.Label>
                          <Form.Control type="text" id="companyBuilding" name="companyBuilding" value={formData.companyBuilding} onChange={handleChange} />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyStreet" className="form-label-custom">ถนน</Form.Label>
                          <Form.Control type="text" id="companyStreet" name="companyStreet" value={formData.companyStreet} onChange={handleChange} />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companySoi" className="form-label-custom">ซอย</Form.Label>
                          <Form.Control type="text" id="companySoi" name="companySoi" value={formData.companySoi} onChange={handleChange} />
                        </Form.Group>
                      </div>
                    </div>

                    <div className="row g-3">
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyProvince" className="form-label-custom ws-required">จังหวัด</Form.Label>
                          <Form.Select id="companyProvince" name="companyProvince" value={selectedCompanyProvinceId} onChange={handleCompanyAddressSelectChange} required>
                            <option value="">เลือกจังหวัด</option>
                            {companyProvinceOptions.map(p => (
                              <option key={p.id} value={String(p.id)}>{p.name_th}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyDistrict" className="form-label-custom ws-required">อำเภอ/เขต</Form.Label>
                          <Form.Select
                            key={selectedCompanyProvinceId}
                            id="companyDistrict"
                            name="companyDistrict"
                            value={selectedCompanyDistrictId}
                            onChange={handleCompanyAddressSelectChange}
                            required
                            disabled={!selectedCompanyProvinceId}
                          >
                            <option value="">เลือกอำเภอ/เขต</option>
                            {companyDistrictOptions.map(d => (
                              <option key={d.id} value={String(d.id)}>{d.name_th}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                      <div className="col-md-4">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companySubdistrict" className="form-label-custom ws-required">ตำบล/แขวง</Form.Label>
                          <Form.Select
                            key={selectedCompanyDistrictId}
                            id="companySubdistrict"
                            name="companySubdistrict"
                            value={selectedCompanySubdistrictId}
                            onChange={handleCompanyAddressSelectChange}
                            required
                            disabled={!selectedCompanyDistrictId}
                          >
                            <option value="">เลือกตำบล/แขวง</option>
                            {companySubdistrictOptions.map(t => (
                              <option key={t.id} value={String(t.id)}>{t.name_th}</option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                    </div>

                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="companyZipCode" className="form-label-custom ws-required">รหัสไปรษณีย์</Form.Label>
                      <Form.Control type="text" id="companyZipCode" name="companyZipCode" value={formData.companyZipCode} readOnly />
                    </Form.Group>

                    <div className="row g-3">
                      <div className="col-md-6">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyPhone" className="form-label-custom">เบอร์โทรบริษัท</Form.Label>
                          <Form.Control type="tel" id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} />
                        </Form.Group>
                      </div>
                      <div className="col-md-6">
                        <Form.Group className="row-custom">
                          <Form.Label htmlFor="companyEmail" className="form-label-custom">อีเมลบริษัท</Form.Label>
                          <Form.Control type="email" id="companyEmail" name="companyEmail" value={formData.companyEmail} onChange={handleChange} />
                        </Form.Group>
                      </div>
                    </div>

                    <Form.Group className="row-custom">
                      <Form.Label htmlFor="companyDescription" className="form-label-custom">รายละเอียดบริษัท</Form.Label>
                      <Form.Control as="textarea" id="companyDescription" name="companyDescription" rows={3} value={formData.companyDescription} onChange={handleChange} />
                    </Form.Group>

                    <div className="d-flex justify-content-between mt-3">
                      <Button variant="light" className="ws-btn ws-btn-outline border-0" onClick={handlePreviousStep}>
                        ย้อนกลับ
                      </Button>
                      <Button type="submit" variant="success" className="ws-btn ws-btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        ยืนยันการสมัคร
                      </Button>
                    </div>
                  </Form>
                </div>
              )}

              {/* Hint เล็ก ๆ */}
              <div className="text-center text-muted mt-3" style={{ fontSize: '.9rem' }}>
                มีบัญชีแล้ว? <button className="btn btn-link p-0 align-baseline" onClick={() => navigate('/login')}>เข้าสู่ระบบ</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title><FontAwesomeIcon icon={faCheckCircle} className="me-2" />สมัครสำเร็จ!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>การสมัครบัญชีผู้ดูแลระบบและข้อมูลบริษัทสำเร็จแล้ว!</p>
          <p>คุณสามารถเข้าสู่ระบบได้ในไม่ช้า</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={() => navigate('/login')}>
            ไปที่หน้าเข้าสู่ระบบ
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Footer ให้กลืนกับ Landing */}
      <footer className="mt-4" style={{ background:'#343a40', color:'#bbb' }}>
        <div className="container py-3">
          <div className="row gy-2 align-items-center">
            <div className="col-md-6 text-center text-md-start">
              &copy; 2025 WorkSter. All rights reserved.
            </div>
            <div className="col-md-6 text-center text-md-end">
              <a href="/" className="me-3 text-decoration-none" style={{ color:'#bbb' }}>หน้าหลัก</a>
              <a href="/public/job-postings" className="me-3 text-decoration-none" style={{ color:'#bbb' }}>ตำแหน่งงาน</a>
              <a href="mailto:info@workster.com" className="text-decoration-none" style={{ color:'#bbb' }}>ติดต่อเรา</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default RegisterUserPage;
