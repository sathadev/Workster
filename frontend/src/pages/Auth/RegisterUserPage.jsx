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
    const [thaiGeoData, setThaiGeoData] = useState([]); // เก็บข้อมูลจังหวัดทั้งหมดจาก API
    const [isLoadingGeoData, setIsLoadingGeoData] = useState(true);
    const [geoDataError, setGeoDataError] = useState(null);
    const [formError, setFormError] = useState(null); // ข้อผิดพลาดจากการ validate ฟอร์ม
    const [isSubmitting, setIsSubmitting] = useState(false); // สถานะกำลังส่งข้อมูล
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // --- States เพื่อเก็บ ID ที่เลือกสำหรับ Dropdown Cascading ของพนักงานและบริษัท ---
    const [selectedEmpProvinceId, setSelectedEmpProvinceId] = useState('');
    const [selectedEmpDistrictId, setSelectedEmpDistrictId] = useState('');
    const [selectedEmpSubdistrictId, setSelectedEmpSubdistrictId] = useState('');

    const [selectedCompanyProvinceId, setSelectedCompanyProvinceId] = useState('');
    const [selectedCompanyDistrictId, setSelectedCompanyDistrictId] = useState('');
    const [selectedCompanySubdistrictId, setSelectedCompanySubdistrictId] = useState('');


    // --- Options สำหรับ Dropdown ที่อยู่ (ดึงจาก thaiGeoData โดยใช้ ID ที่เลือก) ---
    const empProvinceOptions = useMemo(() => {
        return thaiGeoData.map(p => ({ id: String(p.id), name_th: p.name_th }));
    }, [thaiGeoData]);

    const empDistrictOptions = useMemo(() => {
        if (!selectedEmpProvinceId) {
            return [];
        }
        const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedEmpProvinceId);
        return (selectedProvince?.amphure || []).map(a => ({ id: String(a.id), name_th: a.name_th }));
    }, [selectedEmpProvinceId, thaiGeoData]);

    const empSubdistrictOptions = useMemo(() => {
        if (!selectedEmpDistrictId) {
            return [];
        }
        const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedEmpProvinceId);
        const selectedDistrict = selectedProvince?.amphure?.find(a => String(a.id) === selectedEmpDistrictId);
        return (selectedDistrict?.tambon || []).map(t => ({ id: String(t.id), name_th: t.name_th, zip_code: t.zip_code }));
    }, [selectedEmpDistrictId, selectedEmpProvinceId, thaiGeoData]);

    const companyProvinceOptions = useMemo(() => {
        return thaiGeoData.map(p => ({ id: String(p.id), name_th: p.name_th }));
    }, [thaiGeoData]);

    const companyDistrictOptions = useMemo(() => {
        if (!selectedCompanyProvinceId) {
            return [];
        }
        const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedCompanyProvinceId);
        return (selectedProvince?.amphure || []).map(a => ({ id: String(a.id), name_th: a.name_th }));
    }, [selectedCompanyProvinceId, thaiGeoData]);

    const companySubdistrictOptions = useMemo(() => {
        if (!selectedCompanyDistrictId) {
            return [];
        }
        const selectedProvince = thaiGeoData.find(p => String(p.id) === selectedCompanyProvinceId);
        const selectedDistrict = selectedProvince?.amphure?.find(a => String(a.id) === selectedCompanyDistrictId);
        return (selectedDistrict?.tambon || []).map(t => ({ id: String(t.id), name_th: t.name_th, zip_code: t.zip_code }));
    }, [selectedCompanyDistrictId, selectedCompanyProvinceId, thaiGeoData]);


    // --- Effect สำหรับโหลดข้อมูลจังหวัด อำเภอ ตำบล จาก API ---
    useEffect(() => {
        const fetchGeoData = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province_with_amphure_tambon.json');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
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

    // --- Effect เพื่อ Reset selected ID เมื่อ options list เปลี่ยน (บังคับให้ dropdown อัปเดต) ---
    useEffect(() => {
        if (selectedEmpDistrictId && !empDistrictOptions.some(d => d.id === selectedEmpDistrictId)) {
             setSelectedEmpDistrictId('');
             setFormData(prev => ({ ...prev, empDistrict: '', empSubdistrict: '', empZipCode: '' }));
        }
        if (selectedEmpSubdistrictId && !empSubdistrictOptions.some(t => t.id === selectedEmpSubdistrictId)) {
             setSelectedEmpSubdistrictId('');
             setFormData(prev => ({ ...prev, empSubdistrict: '', empZipCode: '' }));
        }
    }, [empDistrictOptions, empSubdistrictOptions, selectedEmpDistrictId, selectedEmpSubdistrictId, setFormData]);

    useEffect(() => {
        if (selectedCompanyDistrictId && !companyDistrictOptions.some(d => d.id === selectedCompanyDistrictId)) {
             setSelectedCompanyDistrictId('');
             setFormData(prev => ({ ...prev, companyDistrict: '', companySubdistrict: '', companyZipCode: '' }));
        }
        if (selectedCompanySubdistrictId && !companySubdistrictOptions.some(t => t.id === selectedCompanySubdistrictId)) {
             setSelectedCompanySubdistrictId('');
             setFormData(prev => ({ ...prev, companySubdistrict: '', companyZipCode: '' }));
        }
    }, [companyDistrictOptions, companySubdistrictOptions, selectedCompanyDistrictId, selectedCompanySubdistrictId, setFormData]);


    // --- Handler สำหรับการเปลี่ยนแปลงค่าใน Input fields ทั่วไป ---
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // --- Handler สำหรับ Dropdown ที่อยู่ของพนักงาน (emp) ---
    const handleEmpAddressSelectChange = (e) => {
        const { name, value } = e.target; // value คือ ID (string) ของ option ที่เลือก
        const selectedText = e.target.options[e.target.selectedIndex].text; // ชื่อ (ภาษาไทย)

        setFormData(prev => ({ ...prev, [name]: selectedText }));

        if (name === 'empProvince') {
            setSelectedEmpProvinceId(value); // อัปเดต state ควบคุม Dropdown ID
            setSelectedEmpDistrictId('');    // รีเซ็ต ID ของอำเภอและตำบล
            setSelectedEmpSubdistrictId('');
            setFormData(prev => ({ // รีเซ็ตค่าในฟอร์มด้วย
                ...prev,
                empDistrict: '', empSubdistrict: '', empZipCode: ''
            }));
        } else if (name === 'empDistrict') {
            setSelectedEmpDistrictId(value); // เก็บ ID ของอำเภอที่เลือก (string)
            setSelectedEmpSubdistrictId(''); // รีเซ็ต ID ของตำบล
            setFormData(prev => ({ // รีเซ็ตค่าในฟอร์มด้วย
                ...prev,
                empSubdistrict: '', empZipCode: ''
            }));
        } else if (name === 'empSubdistrict') {
            setSelectedEmpSubdistrictId(value); // เก็บ ID ของตำบลที่เลือก (string)
            const selectedSubdistrictObj = empSubdistrictOptions.find(t => t.id === value); // เปรียบเทียบ string ID
            setFormData(prev => ({
                ...prev,
                empZipCode: selectedSubdistrictObj ? selectedSubdistrictObj.zip_code : ''
            }));
        }
    };

    // --- Handler สำหรับ Dropdown ที่อยู่ของบริษัท (company) ---
    const handleCompanyAddressSelectChange = (e) => {
        const { name, value } = e.target; // value คือ ID (string)
        const selectedText = e.target.options[e.target.selectedIndex].text; // ชื่อ (ภาษาไทย)

        setFormData(prev => ({ ...prev, [name]: selectedText }));

        if (name === 'companyProvince') {
            setSelectedCompanyProvinceId(value);
            setSelectedCompanyDistrictId('');
            setSelectedCompanySubdistrictId('');
            setFormData(prev => ({
                ...prev,
                companyDistrict: '', companySubdistrict: '', companyZipCode: ''
            }));
        } else if (name === 'companyDistrict') {
            setSelectedCompanyDistrictId(value);
            setSelectedCompanySubdistrictId('');
            setFormData(prev => ({
                ...prev,
                companySubdistrict: '', companyZipCode: ''
            }));
        } else if (name === 'companySubdistrict') {
            setSelectedCompanySubdistrictId(value);
            const selectedSubdistrictObj = companySubdistrictOptions.find(t => t.id === value);
            setFormData(prev => ({
                ...prev,
                companyZipCode: selectedSubdistrictObj ? selectedSubdistrictObj.zip_code : ''
            }));
        }
    };


    // --- Handler สำหรับปุ่ม "ถัดไป" ---
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

        if (isValid) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, formData]);

    // --- Handler สำหรับปุ่ม "ย้อนกลับ" ---
    const handlePreviousStep = useCallback(() => {
        setFormError(null);
        setCurrentStep(prev => prev - 1);
    }, []);

    // --- Handler สำหรับการ Submit ฟอร์มสุดท้าย ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setIsSubmitting(true);

        // Validation สำหรับข้อมูลทั้งหมด (ทั้ง 3 ขั้นตอน)
        if (!formData.companyName || !formData.companySubdistrict || !formData.companyDistrict || !formData.companyProvince || !formData.companyZipCode ||
            !formData.fullName || !formData.phone || !formData.empAddressNo || !formData.empSubdistrict || !formData.empDistrict || !formData.empProvince || !formData.empZipCode ||
            !formData.username || !formData.email || !formData.password) {
            setFormError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง'); // ใช้ข้อความรวม
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
            ].filter(Boolean) // กรองค่าว่างออก
             .join(' '); // รวมด้วย space bar

            // สร้าง payload รวมข้อมูลทั้งหมดสำหรับ Public Register Endpoint
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
            // เรียก API ใหม่สำหรับ Public Registration: POST /api/v1/auth/public-register-company-admin
            const response = await api.post('/auth/public-register-company-admin', combinedPayload);

            console.log('Registration successful:', response.data);
            setFormError(null); // Clear any previous errors on success
            setShowSuccessModal(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error('Registration failed:', err.response?.data || err.message || err);
            setFormError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสมัคร กรุณาลองอีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <>
            {/* Navbar ที่คุณต้องการนำมาใส่ */}
            <nav className="navbar navbar-dark app-navbar" style={{ backgroundColor: '#1E56A0', padding: '10px' }}>
                <div className="container-fluid">
                    <NavLink className="navbar-brand mb-0 h1 fs-4 text-white text-decoration-none" to="/">WorkSter</NavLink>
                    <NavLink to="/login" className="btn btn-outline-light">เข้าสู่ระบบ</NavLink>
                </div>
            </nav>

            <div className="container-fluid">
                <div className="row">
                    <div className="col-12 p-4">
                        <h3 className="mb-4">สมัครบัญชีผู้ใช้</h3>

                        {formError && (
                            <Alert variant="danger" className="mb-3">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                {formError}
                            </Alert>
                        )}

                        {currentStep === 1 && (
                            <div className="card registration-card">
                                <h5 className="card-title mb-4">ขั้นตอนที่ 1: ข้อมูลการเข้าใช้งานระบบ</h5>
                                <Form>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="username" className="form-label-custom">Username :</Form.Label>
                                        <Form.Control type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="email" className="form-label-custom">Email :</Form.Label>
                                        <Form.Control type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="password" className="form-label-custom">Password :</Form.Label>
                                        <Form.Control type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                                    </Form.Group>
                                    <div className="d-flex justify-content-end mt-4">
                                        <Button variant="secondary" onClick={handleNextStep}>ถัดไป</Button>
                                    </div>
                                </Form>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="card registration-card">
                                <h5 className="card-title mb-4">ขั้นตอนที่ 2: ข้อมูลผู้ใช้</h5>
                                <Form>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="fullName" className="form-label-custom">ชื่อ - นามสกุล :</Form.Label>
                                        <Form.Control type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="phone" className="form-label-custom">เบอร์โทร :</Form.Label>
                                        <Form.Control type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                                    </Form.Group>
                                    <hr className="my-3" />
                                    <h6 className="mb-3">ข้อมูลที่อยู่:</h6>
                                    {/* <--- ฟิลด์ที่อยู่พนักงานแยกส่วน (ใช้ Dropdown) ---> */}
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empAddressNo" className="form-label-custom">เลขที่ :</Form.Label>
                                        <Form.Control type="text" id="empAddressNo" name="empAddressNo" value={formData.empAddressNo} onChange={handleChange} required />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empMoo" className="form-label-custom">หมู่ :</Form.Label>
                                        <Form.Control type="text" id="empMoo" name="empMoo" value={formData.empMoo} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empBuilding" className="form-label-custom">อาคาร/หมู่บ้าน :</Form.Label>
                                        <Form.Control type="text" id="empBuilding" name="empBuilding" value={formData.empBuilding} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empStreet" className="form-label-custom">ถนน :</Form.Label>
                                        <Form.Control type="text" id="empStreet" name="empStreet" value={formData.empStreet} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empSoi" className="form-label-custom">ซอย :</Form.Label>
                                        <Form.Control type="text" id="empSoi" name="empSoi" value={formData.empSoi} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empProvince" className="form-label-custom">จังหวัด :</Form.Label>
                                        <Form.Select id="empProvince" name="empProvince"
                                            value={selectedEmpProvinceId} // ใช้ ID เพื่อควบคุม Select
                                            onChange={handleEmpAddressSelectChange} required>
                                            <option value="">เลือกจังหวัด</option>
                                            {empProvinceOptions.map(p => (
                                                <option key={p.id} value={String(p.id)}>{p.name_th}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empDistrict" className="form-label-custom">อำเภอ/เขต :</Form.Label>
                                        {/* <--- เพิ่ม key ที่นี่ ---> */}
                                        <Form.Select
                                            key={selectedEmpProvinceId} // <--- เพิ่ม key นี้
                                            id="empDistrict"
                                            name="empDistrict"
                                            value={selectedEmpDistrictId} // ใช้ ID เพื่อควบคุม Select
                                            onChange={handleEmpAddressSelectChange} required disabled={!selectedEmpProvinceId}>
                                            <option value="">เลือกอำเภอ/เขต</option>
                                            {empDistrictOptions.map(d => (
                                                <option key={d.id} value={String(d.id)}>{d.name_th}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empSubdistrict" className="form-label-custom">ตำบล/แขวง :</Form.Label>
                                        {/* <--- เพิ่ม key ที่นี่ ---> */}
                                        <Form.Select
                                            key={selectedEmpDistrictId} // <--- เพิ่ม key นี้
                                            id="empSubdistrict"
                                            name="empSubdistrict"
                                            value={selectedEmpSubdistrictId} // ใช้ ID เพื่อควบคุม Select
                                            onChange={handleEmpAddressSelectChange} required disabled={!selectedEmpDistrictId}>
                                            <option value="">เลือกตำบล/แขวง</option>
                                            {empSubdistrictOptions.map(t => (
                                                <option key={t.id} value={String(t.id)}>{t.name_th}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="empZipCode" className="form-label-custom">รหัสไปรษณีย์ :</Form.Label>
                                        <Form.Control type="text" id="empZipCode" name="empZipCode" value={formData.empZipCode} readOnly />
                                    </Form.Group>
                                    {/* <--- จบฟิลด์ที่อยู่พนักงานแยกส่วน ---> */}

                                    <div className="d-flex justify-content-between mt-4">
                                        <Button variant="light border" onClick={handlePreviousStep}>ย้อนกลับ</Button>
                                        <Button variant="secondary" onClick={handleNextStep}>ถัดไป</Button>
                                    </div>
                                </Form>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="card registration-card">
                                <h5 className="card-title mb-4">ขั้นตอนที่ 3: ข้อมูลบริษัท</h5>
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyName" className="form-label-custom">ชื่อบริษัท :</Form.Label>
                                        <Form.Control type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyAddressNo" className="form-label-custom">เลขที่ :</Form.Label>
                                        <Form.Control type="text" id="companyAddressNo" name="companyAddressNo" value={formData.companyAddressNo} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyMoo" className="form-label-custom">หมู่ :</Form.Label>
                                        <Form.Control type="text" id="companyMoo" name="companyMoo" value={formData.companyMoo} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyBuilding" className="form-label-custom">อาคาร/หมู่บ้าน :</Form.Label>
                                        <Form.Control type="text" id="companyBuilding" name="companyBuilding" value={formData.companyBuilding} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyStreet" className="form-label-custom">ถนน :</Form.Label>
                                        <Form.Control type="text" id="companyStreet" name="companyStreet" value={formData.companyStreet} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companySoi" className="form-label-custom">ซอย :</Form.Label>
                                        <Form.Control type="text" id="companySoi" name="companySoi" value={formData.companySoi} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyProvince" className="form-label-custom">จังหวัด :</Form.Label>
                                        <Form.Select id="companyProvince" name="companyProvince"
                                            value={selectedCompanyProvinceId}
                                            onChange={handleCompanyAddressSelectChange} required>
                                            <option value="">เลือกจังหวัด</option>
                                            {companyProvinceOptions.map(p => (
                                                <option key={p.id} value={String(p.id)}>{p.name_th}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyDistrict" className="form-label-custom">อำเภอ/เขต :</Form.Label>
                                        {/* <--- เพิ่ม key ที่นี่ ---> */}
                                        <Form.Select
                                            key={selectedCompanyProvinceId} // <--- เพิ่ม key นี้
                                            id="companyDistrict"
                                            name="companyDistrict"
                                            value={selectedCompanyDistrictId}
                                            onChange={handleCompanyAddressSelectChange} required disabled={!selectedCompanyProvinceId}>
                                            <option value="">เลือกอำเภอ/เขต</option>
                                            {companyDistrictOptions.map(d => (
                                                <option key={d.id} value={String(d.id)}>{d.name_th}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companySubdistrict" className="form-label-custom">ตำบล/แขวง :</Form.Label>
                                        {/* <--- เพิ่ม key ที่นี่ ---> */}
                                        <Form.Select
                                            key={selectedCompanyDistrictId} // <--- เพิ่ม key นี้
                                            id="companySubdistrict"
                                            name="companySubdistrict"
                                            value={selectedCompanySubdistrictId}
                                            onChange={handleCompanyAddressSelectChange} required disabled={!selectedCompanyDistrictId}>
                                            <option value="">เลือกตำบล/แขวง</option>
                                            {companySubdistrictOptions.map(t => (
                                                <option key={t.id} value={String(t.id)}>{t.name_th}</option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyZipCode" className="form-label-custom">รหัสไปรษณีย์ :</Form.Label>
                                        <Form.Control type="text" id="companyZipCode" name="companyZipCode" value={formData.companyZipCode} readOnly />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyPhone" className="form-label-custom">เบอร์โทรบริษัท :</Form.Label>
                                        <Form.Control type="tel" id="companyPhone" name="companyPhone" value={formData.companyPhone} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyEmail" className="form-label-custom">อีเมลบริษัท :</Form.Label>
                                        <Form.Control type="email" id="companyEmail" name="companyEmail" value={formData.companyEmail} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="row-custom">
                                        <Form.Label htmlFor="companyDescription" className="form-label-custom">รายละเอียดบริษัท :</Form.Label>
                                        <Form.Control as="textarea" id="companyDescription" name="companyDescription" rows="3" value={formData.companyDescription} onChange={handleChange} />
                                    </Form.Group>

                                    <div className="d-flex justify-content-between mt-4">
                                        <Button variant="light border" onClick={handlePreviousStep}>ย้อนกลับ</Button>
                                        <Button type="submit" variant="success" disabled={isSubmitting}>
                                            {isSubmitting ? <Spinner animation="border" size="sm" className="me-2" /> : ''}
                                            ยืนยันการสมัคร
                                        </Button>
                                    </div>
                                </Form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
        </>
    );
}

export default RegisterUserPage;