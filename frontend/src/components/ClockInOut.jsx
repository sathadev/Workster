import { useState } from 'react';
import api from '../api/axios';

/**
 * Component บันทึกเวลาเข้า/ออกงาน (ดีไซน์ดั้งเดิม)
 * ที่แก้ไขปัญหาการกดซ้ำและการอัปเดตหน้าจอแล้ว
 */
function ClockInOut({ attendanceData, onUpdate }) {
    // State สำหรับป้องกันการกดปุ่มซ้ำ
    const [isProcessing, setIsProcessing] = useState(false);

    // ถ้ายังไม่มีข้อมูล ให้แสดงสถานะกำลังโหลดแบบง่ายๆ
    if (!attendanceData) {
        return <p>กำลังโหลดข้อมูลการเข้างาน...</p>;
    }

    // ฟังก์ชันจัดการการเช็คอิน
    const handleCheckIn = async () => {
        if (isProcessing) return; // ป้องกันการกดซ้ำ
        setIsProcessing(true);
        try {
            await api.post('/attendance/checkin');
            await onUpdate(); // เรียกฟังก์ชันแม่เพื่อโหลดข้อมูลใหม่
        } catch (err) {
            console.error("Check-in error:", err.response?.data?.message || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเช็คอิน');
        } finally {
            setIsProcessing(false);
        }
    };

    // ฟังก์ชันจัดการการเช็คเอาท์
    const handleCheckOut = async () => {
        if (isProcessing) return; // ป้องกันการกดซ้ำ
        setIsProcessing(true);
        try {
            await api.post('/attendance/checkout');
            await onUpdate(); // เรียกฟังก์ชันแม่เพื่อโหลดข้อมูลใหม่
        } catch (err) {
            console.error("Check-out error:", err.response?.data?.message || err.message);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเช็คเอาท์');
        } finally {
            setIsProcessing(false);
        }
    };

    const { checkinTime, checkoutTime, hasCheckedIn, hasCheckedOut } = attendanceData;

    return (
        <>
            <h4>บันทึกเวลา เข้า/ออก งาน</h4>

            {/* บล็อกสำหรับเช็คอิน */}
            <div className="card my-3">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-1">เวลาเข้างาน</h5>
                        <p className="fs-5 mb-0">{checkinTime || '--:--'}</p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleCheckIn} 
                        disabled={hasCheckedIn || isProcessing}
                    >
                        {isProcessing && !checkinTime ? 'กำลังบันทึก...' : 'เช็คอิน'}
                    </button>
                </div>
            </div>

            {/* บล็อกสำหรับเช็คเอาท์ */}
            <div className="card my-3">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-1">เวลาออกงาน</h5>
                        <p className="fs-5 mb-0">
                            {checkoutTime || (hasCheckedIn ? 'ยังไม่ได้เช็คเอาท์' : 'รอเช็คอิน')}
                        </p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        onClick={handleCheckOut} 
                        disabled={!hasCheckedIn || hasCheckedOut || isProcessing}
                    >
                        {isProcessing && !checkoutTime ? 'กำลังบันทึก...' : 'เช็คเอาท์'}
                    </button>
                </div>
            </div>
        </>
    );
}
export default ClockInOut;
