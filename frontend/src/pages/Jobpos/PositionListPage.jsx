import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEdit,
    faTrash,
    faEye,
    faExclamationTriangle,
    faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

function PositionListPage() {
    const { user } = useAuth();

    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Add modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPositionName, setNewPositionName] = useState('');

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Backend จะคืน Global + ของบริษัทผู้ใช้แล้ว
            const res = await api.get('/positions');
            setPositions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            // รองรับทั้งกรณีมี response และไม่มี
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการดึงข้อมูลตำแหน่ง';
            console.error('Failed to fetch positions:', msg);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // ---------- Create ----------
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
            await api.post('/positions', { jobpos_name: newPositionName.trim() });
            alert('บันทึกตำแหน่งงานใหม่สำเร็จ!');
            handleCloseAddModal();
            fetchData();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน';
            console.error('Error creating position:', msg);
            alert(msg);
        }
    };

    // ---------- Update ----------
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
            await api.put(`/positions/${editingPosition.jobpos_id}`, {
                jobpos_name: (editingPosition.jobpos_name || '').trim(),
            });
            alert('อัปเดตตำแหน่งงานสำเร็จ!');
            handleCloseEditModal();
            fetchData();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการอัปเดตตำแหน่งงาน';
            console.error('Error updating position:', msg);
            alert(msg);
        }
    };

    // ---------- Delete ----------
    const handleDelete = async (position) => {
        if (!user) return;

        // กันเหนียวฝั่ง UI (Backend กันอยู่แล้ว)
        if (position.company_id === null) {
            alert('คุณไม่มีสิทธิ์ลบตำแหน่งงาน Global');
            return;
        }
        if (position.company_id !== user.company_id) {
            alert('คุณไม่มีสิทธิ์ลบตำแหน่งงานของบริษัทอื่น');
            return;
        }

        // ยืนยันก่อนลบ
        // eslint-disable-next-line no-restricted-globals
        const ok = confirm(
            `คุณแน่ใจหรือไม่ที่จะลบตำแหน่ง "${position.jobpos_name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`
        );
        if (!ok) return;

        try {
            await api.delete(`/positions/${position.jobpos_id}`);
            alert('ลบตำแหน่งงานสำเร็จ');
            fetchData();
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการลบตำแหน่งงาน';
            console.error('Error deleting position:', msg);
            alert(msg);
        }
    };

    // ---------- Access guard ----------
    // อนุญาตเฉพาะ HR/ผู้ดูแล: jobpos_id ใน {1,2,3}
    const canAccess =
        !!user && (user.jobpos_id === 1 || user.jobpos_id === 2 || user.jobpos_id === 3);

    if (!canAccess) {
        return (
            <Alert variant="danger" className="mt-5 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </Alert>
        );
    }

    if (loading) {
        return <div className="text-center mt-5">กำลังโหลดข้อมูล...</div>;
    }

    if (error) {
        return (
            <Alert variant="danger" className="mt-5 text-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                {error}
            </Alert>
        );
    }

    // ---------- Client-side safety filter ----------
    // แสดงเฉพาะ Global + ของบริษัทตัวเอง (กันเผื่อ data side-effect)
    const filteredPositions = positions.filter((pos) => {
        if (!user) return false;
        return pos.company_id === null || pos.company_id === user.company_id;
    });

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '2rem' }}>ตำแหน่งงาน</h4>
                <Button variant="outline-primary" onClick={handleShowAddModal}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    เพิ่มตำแหน่งใหม่
                </Button>
            </div>

           

            {/* เพิ่มส่วนนี้เพื่อสร้างกรอบครอบทั้งหมด */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    {filteredPositions.length === 0 && (
                        <Alert variant="info" className="text-center">
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                            ไม่พบตำแหน่งงาน
                        </Alert>
                    )}

                    {filteredPositions.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered text-center align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>ชื่อตำแหน่ง</th>
                                        <th style={{ width: '250px' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPositions.map((pos) => (
                                        <tr key={pos.jobpos_id}>
                                            <td>{pos.jobpos_name}</td>
                                            <td>
                                                <Link
                                                    to={`/positions/view/${pos.jobpos_id}`}
                                                    className="btn btn-info btn-sm me-2 text-white"
                                                    title="ดูพนักงาน"
                                                >
                                                    <FontAwesomeIcon icon={faEye} /> ดู
                                                </Link>

                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2 text-white"
                                                    title="แก้ไข"
                                                    onClick={() => handleShowEditModal(pos)}
                                                    disabled={pos.company_id === null} // กันแก้ Global
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> แก้ไข
                                                </Button>

                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    title="ลบ"
                                                    onClick={() => handleDelete(pos)}
                                                    disabled={pos.company_id === null} // กันลบ Global
                                                >
                                                    <FontAwesomeIcon icon={faTrash} /> ลบ
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: เพิ่มตำแหน่ง */}
            <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>เพิ่มตำแหน่งงานใหม่</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleCreatePosition}>
                    <Modal.Body>
                        <Form.Group controlId="positionNameCreate">
                            <Form.Label>ชื่อตำแหน่ง</Form.Label>
                            <Form.Control
                                type="text"
                                value={newPositionName}
                                onChange={(e) => setNewPositionName(e.target.value)}
                                required
                                placeholder="เช่น HR Manager"
                                autoFocus
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseAddModal}>
                            ยกเลิก
                        </Button>
                        <Button variant="primary" type="submit">
                            บันทึก
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Modal: แก้ไขตำแหน่ง */}
            {editingPosition && (
                <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>แก้ไขตำแหน่งงาน</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleUpdatePosition}>
                        <Modal.Body>
                            <Form.Group controlId="positionNameEdit">
                                <Form.Label>ชื่อตำแหน่ง</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={editingPosition.jobpos_name || ''}
                                    onChange={(e) =>
                                        setEditingPosition({
                                            ...editingPosition,
                                            jobpos_name: e.target.value,
                                        })
                                    }
                                    required
                                    placeholder="เช่น HR Manager"
                                />
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseEditModal}>
                                ยกเลิก
                            </Button>
                            <Button variant="warning" type="submit" className="text-white">
                                อัปเดต
                            </Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            )}
        </div>
    );
}

export default PositionListPage;
