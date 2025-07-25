import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Form, Button, Row, Col } from 'react-bootstrap';

// --- Data for fields, grouped for clarity ---
const workAndLateFields = [
    { label: 'เวลาเข้างาน', name: 'startwork', type: 'time' },
    { label: 'เวลาเลิกงาน', name: 'endwork', type: 'time' },
    { label: 'นาทีที่อนุโลมให้สาย', name: 'about_late', type: 'number', unit: 'นาที' },
    { label: 'จำนวนครั้งที่มาสายได้', name: 'late_allowed_count', type: 'number', unit: 'ครั้ง/เดือน' },
    { label: 'เงินที่หักเมื่อสายเกินกำหนด', name: 'late_deduction_amount', type: 'number', unit: 'บาท/ครั้ง' },
];

const leaveQuotaFields = [
    { label: 'ลาป่วย', name: 'about_sickleave', type: 'number' },
    { label: 'ลากิจ', name: 'about_personalleave', type: 'number' },
    { label: 'ลาพักผ่อนประจำปี', name: 'about_annualleave', type: 'number' },
    { label: 'ลาคลอดบุตร', name: 'about_maternityleave', type: 'number' },
    { label: 'ลาเพื่อเลี้ยงดูบุตร', name: 'about_childcareleave', type: 'number' },
    { label: 'ลาช่วยภริยาคลอดบุตร', name: 'about_paternityleave', type: 'number' },
    { label: 'ลารับราชการทหาร', name: 'about_militaryleave', type: 'number' },
    { label: 'ลาอุปสมบท', name: 'about_ordinationleave', type: 'number' },
    { label: 'ลาเพื่อทำหมัน', name: 'about_sterilizationleave', type: 'number' },
    { label: 'ลาฝึกอบรม', name: 'about_trainingleave', type: 'number' },
    { label: 'ลาเพื่อจัดการศพ', name: 'about_funeralleave', type: 'number' },
];

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const THAI_DAYS_SHORT = { Mon: 'จ.', Tue: 'อ.', Wed: 'พ.', Thu: 'พฤ.', Fri: 'ศ.', Sat: 'ส.', Sun: 'อา.' };

// --- Reusable Component for Each Setting Row ---
const SettingRow = ({ field, value, isEditMode, onChange, formatDisplayValue }) => (
    <Form.Group as={Row} className="mb-2 align-items-center" controlId={`form-${field.name}`}>
        <Form.Label column sm={5} md={4} className="text-sm-end text-muted pe-3">
            {field.label}
        </Form.Label>
        <Col sm={7} md={8}>
            {isEditMode ? (
                <Form.Control
                    type={field.type}
                    name={field.name}
                    value={value || (field.type === 'number' ? '0' : '')}
                    onChange={onChange}
                    step={field.name === 'late_deduction_amount' ? '0.01' : '1'}
                    size="sm" 
                />
            ) : (
                <p className="mb-0 fw-bold">
                    {formatDisplayValue(field, value)}
                    {field.unit && ` ${field.unit}`}
                </p>
            )}
        </Col>
    </Form.Group>
);

// --- Main Page Component ---
function SettingsPage() {
    const [settings, setSettings] = useState({});
    const [originalSettings, setOriginalSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const formatDisplayValue = (field, value) => {
        if (value === null || value === undefined) {
            return field.type === 'number' ? '0' : '--:--';
        }
        if (field.type === 'time' && value) {
            const [hour, minute] = value.split(':');
            return `${hour}:${minute}`;
        }
        if (field.name === 'late_deduction_amount') {
            return Number(value).toFixed(2);
        }
        return value;
    };

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const response = await api.get('/settings');
                const fetched = response.data || {};
                fetched.work_days = (typeof fetched.work_days === 'string') ? fetched.work_days.split(',').filter(Boolean) : [];
                setSettings(fetched);
                setOriginalSettings(JSON.parse(JSON.stringify(fetched)));
            } catch (err) {
                setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({ ...prev, [name]: type === 'number' ? Number(value) || 0 : value }));
    };

    const handleWorkDaysChange = (e) => {
        const { value, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            work_days: checked ? [...(prev.work_days || []), value] : (prev.work_days || []).filter(day => day !== value)
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put('/settings', settings);
            const updated = response.data || {};
            updated.work_days = (typeof updated.work_days === 'string') ? updated.work_days.split(',').filter(Boolean) : [];
            setSettings(updated);
            setOriginalSettings(JSON.parse(JSON.stringify(updated)));
            setIsEditMode(false);
            alert('บันทึกการตั้งค่าสำเร็จ!');
        } catch (err) {
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
    };
    
    const handleCancel = () => {
        setSettings(originalSettings);
        setIsEditMode(false);
    };

    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">ตั้งค่าข้อมูลบริษัท</h4>
                {!isEditMode && <Button variant="primary" onClick={() => setIsEditMode(true)}>แก้ไขข้อมูล</Button>}
            </div>
            
            <div className="card p-3">
                <Form onSubmit={handleSubmit}>
                    <h6 className="text-primary fw-bold mb-3">เวลาทำงานและกฎการมาสาย</h6>
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

                    <hr className="my-3" />

                    <h6 className="text-primary fw-bold mb-3">โควต้าวันลา (วัน/ปี)</h6>
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

                    <hr className="my-3" />

                    <h6 className="text-primary fw-bold mb-3">วันที่ทำงาน</h6>
                    <div className="text-center bg-light p-2 rounded">
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
                            />
                        ))}
                    </div>

                    {isEditMode && (
                        <div className="text-end mt-3">
                            <Button variant="secondary" onClick={handleCancel} className="me-2">ยกเลิก</Button>
                            <Button type="submit" variant="success">บันทึกการเปลี่ยนแปลง</Button>
                        </div>
                    )}
                </Form>
            </div>
        </div>
    );
}

export default SettingsPage;
