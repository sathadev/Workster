// frontend/src/pages/Jobpos/PositionListPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Modal, Button, Form, FormControl, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faExclamationTriangle, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext'; // <-- Import useAuth

function PositionListPage() {
    const { user } = useAuth(); // <-- ดึง user จาก AuthContext
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State สำหรับ Modal เพิ่มข้อมูล
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPositionName, setNewPositionName] = useState('');
    
    // State สำหรับ Modal แก้ไขข้อมูล
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // ส่ง req.companyId ไปยัง Backend โดยตรงผ่าน interceptor
            const response = await api.get('/positions'); 
            setPositions(response.data);
        } catch (err) { 
            console.error("Failed to fetch positions", err.response?.data || err.message);
            setError(err.response?.data?.message || "เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง");
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        if (user) { // ต้องรอให้ user โหลดเสร็จก่อน
            fetchData(); 
        }
    }, [user]); // <-- เพิ่ม user ใน dependency array

    // --- ฟังก์ชันสำหรับ Modal เพิ่มข้อมูล ---
    const handleShowAddModal = () => {
        setNewPositionName('');
        setShowAddModal(true);
    };
    const handleCloseAddModal = () => { 
        setShowAddModal(false);
        setNewPositionName('');
    };
    const handleCreatePosition = async (e) => {
        e.preventDefault();
        try {
            // ไม่มีการเลือก Global Position จาก Frontend ในหน้านี้
            await api.post('/positions', { jobpos_name: newPositionName });
            alert('บันทึกตำแหน่งงานใหม่สำเร็จ!');
            handleCloseAddModal();
            fetchData();
        } catch (err) { 
            console.error("Error creating position:", err.response?.data || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน'); 
        }
    };

    // --- ฟังก์ชันสำหรับ Modal แก้ไขข้อมูล ---
    const handleShowEditModal = (position) => {
        setEditingPosition({ ...position }); 
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => { 
        setShowEditModal(false);
        setEditingPosition(null); 
    };
    const handleUpdatePosition = async (e) => {
        e.preventDefault();
        if (!editingPosition) return;
        try {
            await api.put(`/positions/${editingPosition.jobpos_id}`, { jobpos_name: editingPosition.jobpos_name });
            alert('อัปเดตตำแหน่งงานสำเร็จ!');
            handleCloseEditModal();
            fetchData();
        } catch (err) { 
            console.error("Error updating position:", err.response?.data || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต'); 
        }
    };
    
    // --- ฟังก์ชันสำหรับลบ ---
    const handleDelete = async (position) => {
        if (!user) return; // ควรมี user ก่อน

        // ตรวจสอบสิทธิ์สำหรับ Admin/HR ปกติ: ลบได้เฉพาะของบริษัทตัวเอง และห้ามลบ Global
        if (position.company_id === null) {
            alert("คุณไม่มีสิทธิ์ลบตำแหน่งงาน Global");
            return;
        }
        if (position.company_id !== user.company_id) { 
            alert("คุณไม่มีสิทธิ์ลบตำแหน่งงานของบริษัทอื่น");
            return;
        }

        if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบตำแหน่ง "${position.jobpos_name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
            try {
                await api.delete(`/positions/${position.jobpos_id}`);
                alert('ลบตำแหน่งงานสำเร็จ');
                fetchData(); 
            } catch (err) { 
                console.error("Error deleting position:", err.response?.data || err.message);
                alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ'); 
            }
        }
    };

    if (loading) return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    if (error) return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2"/>{error}</Alert>;
    
    // กรองตำแหน่งงานที่แสดงสำหรับ Admin/HR ปกติ
    // Admin/HR ปกติ เห็นเฉพาะ Global (company_id is null) และของบริษัทตัวเอง
    const filteredPositions = positions.filter(pos => {
        if (user && user.isSuperAdmin) {
            return false; // Super Admin ไม่เห็นหน้านี้ หรือถ้าเห็นก็ไม่แสดง Jobpos
        }
        return pos.company_id === null || pos.company_id === user.company_id;
    });

    // ถ้าไม่ใช่ Admin/HR (เช่น Super Admin หรือพนักงานทั่วไป) ไม่ควรเห็นหน้านี้
    // หรือถ้า user โหลดแล้ว แต่ไม่ใช่ jobpos_id ที่มีสิทธิ์ ก็ให้แจ้งเตือน
    if (!user || !(user.jobpos_id === 1 || user.jobpos_id === 2 || user.jobpos_id === 3)) {
        return <Alert variant="danger" className="mt-5 text-center"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2"/>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Alert>;
    }


    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">ตำแหน่งงาน</h4>
                {/* ปุ่มเพิ่มตำแหน่ง แสดงสำหรับ Admin/HR เท่านั้น */}
                <Button variant="outline-primary" onClick={handleShowAddModal}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> เพิ่มตำแหน่งใหม่
                </Button>
            </div>

            {filteredPositions.length === 0 && !loading && (
                <Alert variant="info" className="text-center mt-3">
                    <FontAwesomeIcon icon={faInfoCircle} className="me-2"/> ไม่พบตำแหน่งงาน
                </Alert>
            )}

            <table className="table table-hover table-bordered text-center align-middle mt-3">
                <thead className="table-light">
                    <tr>
                        <th>ชื่อตำแหน่ง</th>
                        <th>ประเภท</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPositions.map(pos => (
                        <tr key={pos.jobpos_id}>
                            <td>{pos.jobpos_name}</td>
                            <td>
                                {pos.company_id === null ? (
                                    <span className="badge bg-secondary">Global</span>
                                ) : (
                                    <span className="badge bg-info text-dark">เฉพาะบริษัท</span>
                                )}
                            </td>
                            <td style={{ width: '250px' }}>
                                {/* ปุ่มจัดการจะแสดงตามสิทธิ์ (สำหรับ Admin/HR ปกติ) */}
                                {/* Admin/HR: ดู, แก้ไข, ลบได้เฉพาะของตัวเอง/Global (ห้ามแก้ Global) */}
                                <Link to={`/positions/view/${pos.jobpos_id}`} className="btn btn-info btn-sm me-2 text-white" title="ดูพนักงาน">
                                    <FontAwesomeIcon icon={faEye} /> ดู
                                </Link>

                                {/* ถ้าเป็นตำแหน่ง Global ห้ามแก้ไข/ลบ */}
                                {pos.company_id === null ? (
                                    <span className="text-muted">ไม่สามารถจัดการได้</span>
                                ) : (
                                    <>
                                        <Button variant="warning" size="sm" className="me-2 text-white" title="แก้ไข" onClick={() => handleShowEditModal(pos)}>
                                            <FontAwesomeIcon icon={faEdit} /> แก้ไข
                                        </Button>
                                        <Button variant="danger" size="sm" title="ลบ" onClick={() => handleDelete(pos)}>
                                            <FontAwesomeIcon icon={faTrash} /> ลบ
                                        </Button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Modal สำหรับ "เพิ่ม" ตำแหน่ง */}
            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>เพิ่มตำแหน่งงานใหม่</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePosition}>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>ชื่อตำแหน่ง</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={newPositionName}
                                onChange={(e) => setNewPositionName(e.target.value)}
                                required 
                            />
                        </Form.Group>
                        {/* ลบ Checkbox "ตำแหน่งงาน Global" ออกจาก Modal เพิ่ม */}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseAddModal}>ยกเลิก</Button>
                        <Button variant="primary" type="submit">บันทึก</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
            
            {/* Modal สำหรับ "แก้ไข" ตำแหน่ง */}
            {editingPosition && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>แก้ไขตำแหน่งงาน</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdatePosition}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>ชื่อตำแหน่ง</Form.Label>
                                <Form.Control 
                                    type="text"
                                    value={editingPosition.jobpos_name}
                                    onChange={(e) => setEditingPosition({...editingPosition, jobpos_name: e.target.value})}
                                    required 
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseEditModal}>ยกเลิก</Button>
                            <Button variant="warning" type="submit" className="text-white">อัปเดต</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </div>
    );
}

export default PositionListPage;