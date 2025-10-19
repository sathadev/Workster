// frontend/src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Form, Button, Row, Col, Card } from 'react-bootstrap'; // ใช้ Card/Row/Col จาก react-bootstrap จัด layout
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { 
    faEdit, faSave, faTimes, 
    faClock, faDollarSign, faStopwatch, faCalendarDays, faListCheck,
    faCapsules, faPersonWalkingLuggage, faUmbrellaBeach, faBaby, faChild, faPeopleGroup, faUserInjured, 
    faBookOpenReader, faBandAid, faBook, faCross, faCalendarAlt, faCalendarCheck
} from '@fortawesome/free-solid-svg-icons'; 

/* ---------------------------------------------
   ฟิลด์ตั้งค่า: แยกเป็น 2 กลุ่มใหญ่
   1) เวลาทำงาน/กฎการมาสาย
   2) โควต้าวันลา
   เพิ่ม icon/label/type เพื่อใช้วาด UI แบบทั่วไปด้วยคอมโพเนนต์ SettingRow
----------------------------------------------*/
const workAndLateFields = [
    { label: 'เวลาเข้างาน', name: 'startwork', type: 'time', icon: faClock },
    { label: 'เวลาเลิกงาน', name: 'endwork', type: 'time', icon: faClock },
    { label: 'นาทีอนุโลมสาย', name: 'about_late', type: 'number', unit: 'นาที', icon: faStopwatch }, 
    { label: 'ครั้งมาสายได้', name: 'late_allowed_count', type: 'number', unit: 'ครั้ง/เดือน', icon: faCalendarDays }, 
    { label: 'เงินหักสาย', name: 'late_deduction_amount', type: 'number', unit: 'บาท/ครั้ง', icon: faDollarSign },
];

const leaveQuotaFields = [
    { label: 'ลาป่วย', name: 'about_sickleave', type: 'number', icon: faCapsules }, 
    { label: 'ลากิจ', name: 'about_personalleave', type: 'number', icon: faPersonWalkingLuggage }, 
    { label: 'ลาพักผ่อน', name: 'about_annualleave', type: 'number', icon: faUmbrellaBeach }, 
    { label: 'ลาคลอดบุตร', name: 'about_maternityleave', type: 'number', icon: faBaby }, 
    { label: 'ลาเลี้ยงดูบุตร', name: 'about_childcareleave', type: 'number', icon: faChild }, 
    { label: 'ลาช่วยภริยาคลอด', name: 'about_paternityleave', type: 'number', icon: faPeopleGroup }, 
    { label: 'ลารับราชการทหาร', name: 'about_militaryleave', type: 'number', icon: faUserInjured }, 
    { label: 'ลาอุปสมบท', name: 'about_ordinationleave', type: 'number', icon: faBookOpenReader }, 
    { label: 'ลาทำหมัน', name: 'about_sterilizationleave', type: 'number', icon: faBandAid }, 
    { label: 'ลาฝึกอบรม', name: 'about_trainingleave', type: 'number', icon: faBookOpenReader }, 
    { label: 'ลาจัดการศพ', name: 'about_funeralleave', type: 'number', icon: faCross }, 
];

// ค่าคงที่ของวันทำงาน + label ภาษาไทยแบบย่อ
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const THAI_DAYS_SHORT = { Mon: 'จ.', Tue: 'อ.', Wed: 'พ.', Thu: 'พฤ.', Fri: 'ศ.', Sat: 'ส.', Sun: 'อา.' };

/* ---------------------------------------------
   คอมโพเนนต์แถวตั้งค่าที่นำกลับมาใช้ซ้ำ (Reusable)
   - แสดงหัวข้อ + ไอคอน
   - โหมดดู: โชว์ค่าอ่านอย่างเดียว
   - โหมดแก้ไข: ใช้ <Form.Control> ให้แก้ไขค่าได้
----------------------------------------------*/
const SettingRow = ({ field, value, isEditMode, onChange, formatDisplayValue }) => (
    <Col sm={12} md={6} lg={4} className="mb-3"> {/* แบ่งคอลัมน์ 12/6/4 เพื่อให้ responsive */}
        <Card className="h-100 shadow-sm border-0 setting-item-card"> {/* กล่องตั้งค่าของแต่ละฟิลด์ */}
            <Card.Body className="d-flex flex-column justify-content-between">
                {/* หัวข้อ + ไอคอน */}
                <div className="d-flex align-items-center mb-2">
                    {field.icon && <FontAwesomeIcon icon={field.icon} className="me-2 text-info fs-5" />} 
                    <Card.Title className="mb-0 fw-bold text-dark" style={{ fontSize: '1rem' }}>
                        {field.label} :
                    </Card.Title>
                </div>

                {/* สลับโหมดระหว่าง "อ่าน" กับ "แก้ไข" */}
                {isEditMode ? (
                    <Form.Control
                        type={field.type}
                        name={field.name}
                        value={value || (field.type === 'number' ? '0' : '')} // กันค่าว่าง/undefined
                        onChange={onChange}
                        step={field.name === 'late_deduction_amount' ? '0.01' : '1'} // ยอมรับทศนิยมสำหรับยอดเงิน
                        className="form-control mt-2"
                        style={{ fontSize: '1rem', height: '40px' }}
                    />
                ) : (
                    <Card.Text className="mb-0 ms-4 fw-bold text-primary" style={{ fontSize: '1.2rem' }}>
                        {formatDisplayValue(field, value)} {/* แปลงค่าก่อนแสดงผล (เช่น 08:30 / 0.00) */}
                        {field.unit && ` ${field.unit}`}    {/* หน่วย (นาที/ครั้ง/บาทฯ) */}
                    </Card.Text>
                )}
            </Card.Body>
        </Card>
    </Col>
);

/* ---------------------------------------------
   คอมโพเนนต์หลัก: SettingsPage
   - โหลดค่า settings เริ่มต้นจาก API /settings
   - มีโหมดแก้ไข (isEditMode) เพื่อให้แก้ทุกฟิลด์ในแต่ละส่วน
   - ปุ่มบันทึก/ยกเลิก อยู่ท้ายฟอร์ม
----------------------------------------------*/
function SettingsPage() {
    // settings = ค่าปัจจุบันบนหน้าจอ, originalSettings = สำเนาก่อนแก้ไข (ไว้ยกเลิก)
    const [settings, setSettings] = useState({});
    const [originalSettings, setOriginalSettings] = useState({});
    const [loading, setLoading] = useState(true);   // โหลดข้อมูลหน้าแรก
    const [error, setError] = useState(null);       // เก็บ error ขณะโหลด
    const [isEditMode, setIsEditMode] = useState(false); // โหมดแก้ไขทั้งหมด

    // รูปแบบการแสดงผลค่าตามชนิดฟิลด์ (อ่านอย่างเดียว)
    const formatDisplayValue = (field, value) => {
        if (value === null || value === undefined) {
            return field.type === 'number' ? '0' : '--:--'; // กันค่าหาย
        }
        if (field.type === 'time' && value) {
            const [hour, minute] = value.split(':'); // ตัดวินาทีทิ้ง ถ้ามี
            return `${hour}:${minute}`;
        }
        if (field.name === 'late_deduction_amount') {
            return Number(value).toFixed(2); // เงินทศนิยม 2 ตำแหน่ง
        }
        return value;
    };

    // โหลดค่าตั้งค่าเริ่มต้นจาก API ครั้งแรก
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await api.get('/settings');
                const fetched = response.data || {};

                // work_days อาจเป็น string จากแบ็กเอนด์ -> แปลงเป็น array เพื่อใช้กับ checkbox
                fetched.work_days = (typeof fetched.work_days === 'string')
                    ? fetched.work_days.split(',').filter(Boolean)
                    : [];

                setSettings(fetched);
                setOriginalSettings(JSON.parse(JSON.stringify(fetched))); // clone เก็บไว้สำหรับกดยกเลิก
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    // อัปเดตค่าใน state เมื่อพิมพ์/แก้ไข input (number -> แปลงเป็น Number)
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'number' ? Number(value) || 0 : value }));
    };

    // จัดการ checkbox สำหรับวันทำงาน (ใส่/เอาออกจาก array)
    const handleWorkDaysChange = (e) => {
        const { value, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            work_days: checked
                ? [...(prev.work_days || []), value]
                : (prev.work_days || []).filter(day => day !== value)
        }));
    };
    
    // บันทึกการตั้งค่าใหม่ (PUT ไปที่ /settings) แล้วอัปเดต state + ปิดโหมดแก้ไข
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/settings', settings);
            const updated = response.data || {};

            // ซิงค์ชนิดข้อมูล work_days ให้เป็น array สำหรับ UI เช่นเดิม
            updated.work_days = (typeof updated.work_days === 'string')
                ? updated.work_days.split(',').filter(Boolean)
                : [];

            setSettings(updated);
            setOriginalSettings(JSON.parse(JSON.stringify(updated)));
            setIsEditMode(false);
            alert('บันทึกการตั้งค่าสำเร็จ!');
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };
    
    // ยกเลิกการแก้ไข -> คืนค่าเดิม + ปิดโหมดแก้ไข
    const handleCancel = () => {
        setSettings(originalSettings); 
        setIsEditMode(false);
    };

    // สถานะโหลด/ผิดพลาด
    if (loading) return <div className="text-center mt-5 text-muted">กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger" style={{ fontSize: '0.95rem' }}>{error}</div>;

    return (
        <div className="settings-page-container">
            {/* หัวหน้าเพจ */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ตั้งค่าข้อมูลบริษัท</h4>
                {/* ปุ่มแก้ไขหลักถูกย้ายไปไว้ในหัวข้อ Section 1 */}
            </div>
            
            {/* กล่องหลักครอบทุก Section */}
            <Card className="p-4 shadow-lg border-0 mt-4"> 
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        {/* Section 1: เวลาทำงานและกฎการมาสาย */}
                        <div className="settings-section mb-5">
                            {/* ปุ่ม "แก้ไขข้อมูล" อยู่ในหัวส่วนนี้ (เปิดโหมดแก้ไขทั้งหมด) */}
                            <div className="d-flex justify-content-between align-items-center mb-4" style={{ borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                                <h5 className="setting-section-title mb-0" style={{ fontSize: '1.5rem', color: '#1E56A0' }}>
                                    <FontAwesomeIcon icon={faClock} className="me-2" /> เวลาทำงานและกฎการมาสาย
                                </h5>
                                {!isEditMode && (
                                    <Button variant="primary" onClick={() => setIsEditMode(true)} style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                        <FontAwesomeIcon icon={faEdit} className="me-1" /> แก้ไขข้อมูล
                                    </Button>
                                )}
                            </div>

                            {/* วนฟิลด์ในกลุ่มเวลากับกฎสาย ด้วย SettingRow */}
                            <Row className="justify-content-start"> 
                                {workAndLateFields.map(field => (
                                    <SettingRow 
                                        key={field.name}
                                        field={field} 
                                        value={settings[field.name]} 
                                        isEditMode={isEditMode} 
                                        onChange={handleChange} 
                                        formatDisplayValue={formatDisplayValue}
                                    />
                                ))}
                            </Row>
                        </div>

                        {/* Section 2: โควต้าวันลา */}
                        <div className="settings-section mb-5">
                            <h5 className="setting-section-title mb-4" style={{ fontSize: '1.5rem', color: '#1E56A0', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                                <FontAwesomeIcon icon={faListCheck} className="me-2" /> โควต้าวันลา (วัน/ปี)
                            </h5>
                            <Row className="justify-content-start">
                                {leaveQuotaFields.map(field => (
                                    <SettingRow 
                                        key={field.name}
                                        field={field} 
                                        value={settings[field.name]} 
                                        isEditMode={isEditMode} 
                                        onChange={handleChange} 
                                        formatDisplayValue={formatDisplayValue}
                                    />
                                ))}
                            </Row>
                        </div>

                        {/* Section 3: วันที่ทำงาน */}
                        <div className="settings-section mb-5">
                            <h5 className="setting-section-title mb-4" style={{ fontSize: '1.5rem', color: '#1E56A0', borderBottom: '2px solid #eee', paddingBottom: '0.5rem' }}>
                                <FontAwesomeIcon icon={faCalendarCheck} className="me-2" /> วันที่ทำงาน
                            </h5>

                            {/* กล่อง checkbox เลือกวันทำงาน (ปิดแก้ไขเมื่อไม่ใช่โหมดแก้ไข) */}
                            <div className="bg-light p-3 rounded d-flex flex-wrap justify-content-center gap-3" style={{ fontSize: '1rem', border: '1px solid #dee2e6' }}>
                                {ALL_DAYS.map(day => (
                                    <Form.Check 
                                        type="checkbox" 
                                        inline 
                                        key={day} 
                                        id={`day-${day}`}
                                        label={THAI_DAYS_SHORT[day]} 
                                        value={day}
                                        checked={settings.work_days?.includes(day) || false}
                                        onChange={handleWorkDaysChange} 
                                        disabled={!isEditMode}
                                        className="me-3 mb-1 text-dark"
                                        style={{ fontWeight: '500', fontSize: '1.05rem' }} 
                                    />
                                ))}
                            </div>
                        </div>

                        {/* ปุ่มบันทึก/ยกเลิก (แสดงเฉพาะตอนแก้ไข) */}
                        {isEditMode && (
                            <div className="d-flex justify-content-end gap-3 mt-4"> 
                                <Button variant="secondary" onClick={handleCancel} style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                    <FontAwesomeIcon icon={faTimes} className="me-2" /> ยกเลิก
                                </Button>
                                <Button type="submit" variant="success" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                                    <FontAwesomeIcon icon={faSave} className="me-2" /> บันทึกการเปลี่ยนแปลง
                                </Button>
                            </div>
                        )}
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
}

export default SettingsPage;
