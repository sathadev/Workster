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
    const { user } = useAuth(); // ดึงข้อมูลผู้ใช้ปัจจุบัน (ใช้เช็คสิทธิ์เข้า/ลบ/แก้ไข)

    // State หลักของหน้า 
    const [positions, setPositions] = useState([]); // รายชื่อตำแหน่งทั้งหมด (Global + ของบริษัท)
    const [loading, setLoading] = useState(true);   // สถานะกำลังโหลด
    const [error, setError] = useState(null);       // เก็บข้อความ error

    // State สำหรับ Modal "เพิ่มตำแหน่ง" 
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPositionName, setNewPositionName] = useState('');

    // State สำหรับ Modal "แก้ไขตำแหน่ง"
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null); // เก็บตำแหน่งที่กำลังจะแก้ไข

    // โหลดข้อมูลตำแหน่งจาก Backend
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Backend คืนค่าตำแหน่งที่มองเห็นได้ (Global + ของบริษัทผู้ใช้)
            const res = await api.get('/positions');
            setPositions(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            // รองรับ error ทั้งแบบมี response และไม่มี
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

    // โหลดข้อมูลเมื่อมี user (กันกรณี context ยังไม่พร้อม)
    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // สร้างตำแหน่ง
    const handleShowAddModal = () => {
        setNewPositionName('');
        setShowAddModal(true); // เปิดโมดัลเพิ่ม
    };
    const handleCloseAddModal = () => {
        setShowAddModal(false); // ปิดโมดัลเพิ่ม
        setNewPositionName(''); // เคลียร์อินพุต
    };
    const handleCreatePosition = async (e) => {
        e.preventDefault();
        try {
            // ส่งชื่อที่ trim แล้วไปสร้าง
            await api.post('/positions', { jobpos_name: newPositionName.trim() });
            alert('บันทึกตำแหน่งงานใหม่สำเร็จ!');
            handleCloseAddModal();
            fetchData(); // โหลดใหม่ให้เห็นรายการล่าสุด
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการสร้างตำแหน่งงาน';
            console.error('Error creating position:', msg);
            alert(msg);
        }
    };

    // อัปเดตตำแหน่ง 
    const handleShowEditModal = (position) => {
        setEditingPosition({ ...position }); // เก็บข้อมูลตำแหน่งที่จะให้แก้
        setShowEditModal(true);              // เปิดโมดัลแก้ไข
    };
    const handleCloseEditModal = () => {
        setShowEditModal(false); // ปิดโมดัลแก้ไข
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
            fetchData(); // รีเฟรชข้อมูล
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการอัปเดตตำแหน่งงาน';
            console.error('Error updating position:', msg);
            alert(msg);
        }
    };

    //  ลบตำแหน่ง 
    const handleDelete = async (position) => {
        if (!user) return;

        // กันไว้ฝั่ง UI (แม้ backend จะกันอยู่แล้ว)
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
            fetchData(); // โหลดใหม่ให้รายการอัปเดต
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'เกิดข้อผิดพลาดในการลบตำแหน่งงาน';
            console.error('Error deleting position:', msg);
            alert(msg);
        }
    };

    //  อนุญาตเฉพาะ HR/ผู้ดูแล 
    // เงื่อนไข: jobpos_id เป็น 1, 2, หรือ 3 (ปรับตามนโยบายระบบ)
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

    // Loading/Error state 
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

    // การกรอง & เรียงลำดับที่ฝั่ง client
    // 1) แสดงเฉพาะตำแหน่งที่เป็น Global (company_id === null) หรือของบริษัทผู้ใช้
    // 2) จัดลำดับความสำคัญชื่อบางตำแหน่งให้อยู่บนสุด (ประธาน/รองประธาน/Super Admin/HR)
    // 3) แล้วค่อยเรียง Global มาก่อน จากนั้นค่อยเรียงชื่อ (ตาม locale 'th')
    const sortedPositions = positions
        .filter((pos) => {
            if (!user) return false;
            return pos.company_id === null || pos.company_id === user.company_id;
        })
        .sort((a, b) => {
            const aName = a.jobpos_name;
            const bName = b.jobpos_name;

            // Priority 1: 'ประธานบริษัท'
            if (aName === 'ประธานบริษัท' && bName !== 'ประธานบริษัท') {
                return -1;
            }
            if (aName !== 'ประธานบริษัท' && bName === 'ประธานบริษัท') {
                return 1;
            }

            // Priority 2: 'รองประธานบริษัท'
            if (aName === 'รองประธานบริษัท' && bName !== 'รองประธานบริษัท') {
                return -1;
            }
            if (aName !== 'รองประธานบริษัท' && bName === 'รองประธานบริษัท') {
                return 1;
            }

            // Priority 3: 'Super Admin'
            if (aName === 'Super Admin' && bName !== 'Super Admin') {
                return -1;
            }
            if (aName !== 'Super Admin' && bName === 'Super Admin') {
                return 1;
            }

            // Priority 4: 'HR'
            if (aName === 'HR' && bName !== 'HR') {
                return -1;
            }
            if (aName !== 'HR' && bName === 'HR') {
                return 1;
            }

            // Global มาก่อน (company_id === null)
            if (a.company_id === null && b.company_id !== null) {
                return -1;
            }
            if (a.company_id !== null && b.company_id === null) {
                return 1;
            }

            // อื่น ๆ เรียงตามตัวอักษร (ภาษไทย)
            return aName.localeCompare(bName, 'th');
        });

    return (
        <div>
            {/* ส่วนหัว + ปุ่มเพิ่มตำแหน่ง */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold text-dark" style={{ fontSize: '1.8rem' }}>ตำแหน่งงาน</h4>
                <Button variant="outline-primary" onClick={handleShowAddModal}>
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    เพิ่มตำแหน่งใหม่
                </Button>
            </div>

            {/* กรอบการ์ดครอบเนื้อหา */}
            <div className="card shadow-sm mt-4">
                <div className="card-body p-4">
                    {/* ถ้าไม่มีข้อมูล */}
                    {sortedPositions.length === 0 && (
                        <Alert variant="info" className="text-center">
                            <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                            ไม่พบตำแหน่งงาน
                        </Alert>
                    )}

                    {/* ตารางรายการตำแหน่ง */}
                    {sortedPositions.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover table-bordered text-center align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>ชื่อตำแหน่ง</th>
                                        <th style={{ width: '250px' }}>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedPositions.map((pos) => (
                                        <tr key={pos.jobpos_id}>
                                            <td>{pos.jobpos_name}</td>
                                            <td>
                                                {/* ปุ่มดูพนักงานในตำแหน่ง */}
                                                <Link
                                                    to={`/positions/view/${pos.jobpos_id}`}
                                                    className="btn btn-info btn-sm me-2 text-white"
                                                    title="ดูพนักงาน"
                                                >
                                                    <FontAwesomeIcon icon={faEye} /> ดู
                                                </Link>

                                                {/* ปุ่มแก้ไข — ปิดการแก้ไขสำหรับ Global */}
                                                <Button
                                                    variant="warning"
                                                    size="sm"
                                                    className="me-2 text-white"
                                                    title="แก้ไข"
                                                    onClick={() => handleShowEditModal(pos)}
                                                    disabled={pos.company_id === null}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} /> แก้ไข
                                                </Button>

                                                {/* ปุ่มลบ — ปิดการลบสำหรับ Global */}
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    title="ลบ"
                                                    onClick={() => handleDelete(pos)}
                                                    disabled={pos.company_id === null}
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
