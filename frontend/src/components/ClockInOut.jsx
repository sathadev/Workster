// frontend/src/components/ClockInOut.jsx
import api from '../api/axios';

function ClockInOut({ attendanceData, onUpdate }) {
    if (!attendanceData) return null;

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/checkin');
            alert('เช็คอินสำเร็จ!');
            onUpdate(); 
        } catch (err) {
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเช็คอิน');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/checkout');
            alert('เช็คเอาท์สำเร็จ!');
            onUpdate();
        } catch (err) {
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเช็คเอาท์');
        }
    };

    const { checkinTime, checkoutTime, hasCheckedIn } = attendanceData;

    return (
        <>
            <h4>บันทึกเวลา เข้า/ออก งาน</h4>
            <div className="card my-3">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-1">เวลาเข้างาน</h5>
                        <p className="fs-5 mb-0">{checkinTime || '--:--'}</p>
                    </div>
                    <button className="btn btn-primary" onClick={handleCheckIn} disabled={hasCheckedIn}>
                        เช็คอิน
                    </button>
                </div>
            </div>
            <div className="card my-3">
                <div className="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 className="fw-bold mb-1">เวลาออกงาน</h5>
                        <p className="fs-5 mb-0">
                            {checkoutTime || (hasCheckedIn ? 'ยังไม่ได้เช็คเอาท์' : 'ยังไม่ได้เช็คอิน')}
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={handleCheckOut} disabled={!hasCheckedIn || !!checkoutTime}>
                        เช็คเอาท์
                    </button>
                </div>
            </div>
        </>
    );
}
export default ClockInOut;