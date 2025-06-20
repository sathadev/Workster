// frontend/src/pages/SettingsPage.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Form, Button, Row, Col } from 'react-bootstrap'; // Import Row, Col เพิ่ม

const ALL_DAYS = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];

// NEW: ย้าย array ของ fields ออกมาข้างนอกเพื่อความสะอาด
const settingFields = [
    { label: 'เวลาเข้างาน', name: 'startwork', type: 'time' },
    { label: 'เวลาเลิกงาน', name: 'endwork', type: 'time' },
    { label: 'เวลาสาย (นาที)', name: 'about_late', type: 'number' },
    { label: 'วันลาป่วย (วัน)', name: 'about_sickleave', type: 'number' },
    { label: 'วันลากิจ (วัน)', name: 'about_personalleave', type: 'number' },
    { label: 'วันลาพักผ่อนประจำปี (วัน)', name: 'about_annualleave', type: 'number' },
    { label: 'วันลาคลอดบุตร (วัน)', name: 'about_maternityleave', type: 'number' },
    { label: 'วันลาเพื่อเลี้ยงดูบุตร (วัน)', name: 'about_childcareleave', type: 'number' },
    { label: 'วันลาไปช่วยเหลือภริยาคลอดบุตร (วัน)', name: 'about_paternityleave', type: 'number' },
    { label: 'วันลาไปรับราชการทหาร (วัน)', name: 'about_militaryleave', type: 'number' },
    { label: 'วันลาบวช (วัน)', name: 'about_ordinationleave', type: 'number' },
    { label: 'วันลาเพื่อทำหมัน (วัน)', name: 'about_sterilizationleave', type: 'number' },
    { label: 'วันลาฝึกอบรม (วัน)', name: 'about_trainingleave', type: 'number' },
    { label: 'วันลาเพื่อจัดการศพ (วัน)', name: 'about_funeralleave', type: 'number' },
];

function SettingsPage() {
    const [settings, setSettings] = useState({});
    const [originalSettings, setOriginalSettings] = useState({}); // State ใหม่สำหรับเก็บค่าดั้งเดิม
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    // ... useEffect และฟังก์ชัน handle อื่นๆ เหมือนเดิม ...
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await api.get('/settings');
                const fetchedSettings = response.data;
                if (typeof fetchedSettings.work_days === 'string') {
                    fetchedSettings.work_days = fetchedSettings.work_days.split(',').filter(day => day);
                } else if (!fetchedSettings.work_days) {
                    fetchedSettings.work_days = [];
                }
                setSettings(fetchedSettings);
                setOriginalSettings(JSON.parse(JSON.stringify(fetchedSettings))); // เก็บค่าดั้งเดิม (Deep copy)
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

      const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: value
        }));
    };

    const handleWorkDaysChange = (e) => {
        const { value, checked } = e.target;
        setSettings(prevSettings => {
            const currentWorkDays = prevSettings.work_days || [];
            if (checked) {
                // ถ้าถูกติ๊ก และยังไม่มีค่านั้นใน array ให้เพิ่มเข้าไป
                return { ...prevSettings, work_days: [...currentWorkDays, value] };
            } else {
                // ถ้าติ๊กออก ให้กรองค่านั้นออกจาก array
                return { ...prevSettings, work_days: currentWorkDays.filter(day => day !== value) };
            }
        });
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/settings', {
                ...settings,
                work_days: settings.work_days.join(','), // แปลง array กลับเป็น string ก่อนส่ง
            });
            const updatedSettings = response.data;
            if (typeof updatedSettings.work_days === 'string') {
                updatedSettings.work_days = updatedSettings.work_days.split(',').filter(day => day);
            }
            setSettings(updatedSettings);
            setOriginalSettings(JSON.parse(JSON.stringify(updatedSettings)));
            setIsEditMode(false);
            alert('บันทึกการตั้งค่าสำเร็จ!');
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };
    
    // NEW: ฟังก์ชันสำหรับยกเลิกการแก้ไข
    const handleCancel = () => {
        setSettings(originalSettings); // คืนค่ากลับไปเป็นเหมือนเดิม
        setIsEditMode(false);
    };

    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <h4 className="fw-bold">ตั้งค่าข้อมูลบริษัท</h4>
            <p>หน้าหลัก</p>
            <div className="card p-4">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">ข้อมูลการตั้งค่าบริษัท</h5>
                    {/* REFACTORED: ย้ายปุ่มแก้ไขมาไว้ที่ Header ของ Card */}
                    {!isEditMode && (
                        <Button variant="primary" onClick={() => setIsEditMode(true)}>แก้ไข</Button>
                    )}
                </div>
                <hr />
                <Form onSubmit={handleSubmit} className="mt-3">
                    {/* CHANGED: ใช้ Array ที่สร้างไว้ข้างบนเพื่อ map field ทั้งหมด */}
                    {settingFields.map(field => (
                        <Form.Group as={Row} className="mb-3" key={field.name}>
                            <Form.Label column sm={4} md={3} className="text-sm-end">{field.label}</Form.Label>
                            <Col sm={8} md={9}>
                                <Form.Control 
                                    type={field.type} 
                                    name={field.name}
                                    value={settings[field.name] || (field.type === 'number' ? 0 : '')}
                                    onChange={handleChange}
                                    readOnly={!isEditMode} // ใช้ readOnly แทน disabled
                                    plaintext={!isEditMode} // ทำให้ดูเป็นข้อความปกติเมื่อไม่ได้แก้ไข
                                />
                            </Col>
                        </Form.Group>
                    ))}
                    
                    <Form.Group as={Row} className="mb-3">
                        <Form.Label column sm={4} md={3} className="text-sm-end">วันที่ทำงาน</Form.Label>
                        <Col sm={8} md={9} className="d-flex align-items-center flex-wrap">
                            {ALL_DAYS.map(day => (
                                <Form.Check 
                                    type="checkbox"
                                    inline
                                    key={day}
                                    id={`workday-${day}`}
                                    label={day}
                                    value={day}
                                    checked={settings.work_days?.includes(day) || false}
                                    onChange={handleWorkDaysChange}
                                    disabled={!isEditMode}
                                />
                            ))}
                        </Col>
                    </Form.Group>
                    
                    {/* REFACTORED: แสดงปุ่มตามโหมดที่ถูกต้อง */}
                    {isEditMode && (
                        <Row>
                           <Col sm={{ span: 8, offset: 4 }} md={{ span: 9, offset: 3 }}>
                                <Button type="submit" variant="success">บันทึกการเปลี่ยนแปลง</Button>
                                <Button variant="secondary" onClick={handleCancel} className="ms-2">ยกเลิก</Button>
                            </Col>
                        </Row>
                    )}
                </Form>
            </div>
        </div>
    );
}

export default SettingsPage;