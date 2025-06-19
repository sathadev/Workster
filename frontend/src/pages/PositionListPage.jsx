// frontend/src/pages/PositionListPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Modal, Button, Form, FormControl } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye } from '@fortawesome/free-solid-svg-icons';

function PositionListPage() {
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
        try { setLoading(true); const response = await api.get('/positions'); setPositions(response.data); } 
        catch (err) { setError("เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง"); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ฟังก์ชันสำหรับ Modal เพิ่มข้อมูล ---
    const handleShowAddModal = () => setShowAddModal(true);
    const handleCloseAddModal = () => { setShowAddModal(false); setNewPositionName(''); };
    const handleCreatePosition = async (e) => {
        e.preventDefault();
        try {
            await api.post('/positions', { jobpos_name: newPositionName });
            handleCloseAddModal();
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };

    // --- ฟังก์ชันสำหรับ Modal แก้ไขข้อมูล ---
    const handleShowEditModal = (position) => {
        setEditingPosition(position);
        setShowEditModal(true);
    };
    const handleCloseEditModal = () => { setShowEditModal(false); setEditingPosition(null); };
    const handleUpdatePosition = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/positions/${editingPosition.jobpos_id}`, { jobpos_name: editingPosition.jobpos_name });
            handleCloseEditModal();
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'เกิดข้อผิดพลาด'); }
    };
    
    // --- ฟังก์ชันสำหรับลบ ---
    const handleDelete = async (position) => {
        if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบตำแหน่ง "${position.jobpos_name}"?`)) {
            try {
                await api.delete(`/positions/${position.jobpos_id}`);
                fetchData(); // โหลดข้อมูลใหม่หลังลบ
            } catch (err) { alert('เกิดข้อผิดพลาดในการลบ'); }
        }
    };

    if (loading) return <div>กำลังโหลด...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold">ตำแหน่งงาน</h4>
                <Button variant="outline-primary" onClick={handleShowAddModal}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> เพิ่มตำแหน่งใหม่
                </Button>
            </div>

            <table className="table table-hover table-bordered text-center align-middle">
                <thead className="table-light">
                    <tr>
                        <th>ชื่อตำแหน่ง</th>
                        <th style={{ width: '250px' }}>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {positions.map(pos => (
                        <tr key={pos.jobpos_id}>
                            <td>{pos.jobpos_name}</td>
                            <td>
                                <Link to={`/positions/view/${pos.jobpos_id}`} className="btn btn-info btn-sm me-2 text-white" title="ดูพนักงาน">
                                    <FontAwesomeIcon icon={faEye} /> ดู
                                </Link>
                                <Button variant="warning" size="sm" className="me-2 text-white" title="แก้ไข" onClick={() => handleShowEditModal(pos)}>
                                    <FontAwesomeIcon icon={faEdit} /> แก้ไข
                                </Button>
                                <Button variant="danger" size="sm" title="ลบ" onClick={() => handleDelete(pos)}>
                                    <FontAwesomeIcon icon={faTrash} /> ลบ
                                </Button>
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
                        <Form.Group>
                            <Form.Label>ชื่อตำแหน่ง</Form.Label>
                            <Form.Control 
                                type="text" 
                                value={newPositionName} 
                                onChange={(e) => setNewPositionName(e.target.value)}
                                required 
                            />
                        </Form.Group>
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
                            <Form.Group>
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