import { useState } from "react";
import api from "../api/axios";

/**
 * Component บันทึกเวลาเข้า/ออกงาน
 * - รับ prop: attendanceData (ข้อมูลสถานะเข้า/ออกวันนี้), onUpdate (ฟังก์ชันให้พาเรนต์รีเฟรชข้อมูล)
 * - ป้องกันการกดปุ่มซ้ำด้วย isProcessing
 */
function ClockInOut({ attendanceData, onUpdate }) {
  // สถานะภายใน: ใช้บล็อกปุ่มชั่วคราวระหว่างยิง API เพื่อกันการกดรัว ๆ
  const [isProcessing, setIsProcessing] = useState(false);

  // ถ้ายังไม่มี attendanceData (เช่น กำลังโหลด) ให้แสดงข้อความรอ
  if (!attendanceData) {
    return <p>กำลังโหลดข้อมูลการเข้างาน...</p>;
  }

  // กด "เช็คอิน"
  const handleCheckIn = async () => {
    if (isProcessing) return; // กันกดซ้ำ
    setIsProcessing(true);
    try {
      await api.post("/attendance/checkin"); // เรียก API เช็คอิน
      await onUpdate(); // ให้พาเรนต์โหลดข้อมูลใหม่ (อัปเดตเวลาในหน้าจอ)
    } catch (err) {
      console.error("Check-in error:", err.response?.data?.message || err.message);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการเช็คอิน");
    } finally {
      setIsProcessing(false); // ปลดล็อกปุ่ม
    }
  };

  // กด "เช็คเอาท์"
  const handleCheckOut = async () => {
    if (isProcessing) return; // กันกดซ้ำ
    setIsProcessing(true);
    try {
      await api.post("/attendance/checkout"); // เรียก API เช็คเอาท์
      await onUpdate(); // ให้พาเรนต์รีเฟรชข้อมูล
    } catch (err) {
      console.error("Check-out error:", err.response?.data?.message || err.message);
      alert(err.response?.data?.message || "เกิดข้อผิดพลาดในการเช็คเอาท์");
    } finally {
      setIsProcessing(false); // ปลดล็อกปุ่ม
    }
  };

  // ดึงค่าที่ต้องใช้จาก attendanceData เพื่อเขียนโค้ดอ่านง่ายขึ้น
  const { checkinTime, checkoutTime, hasCheckedIn, hasCheckedOut } = attendanceData;

  return (
    <>
      <h4>บันทึกเวลา เข้า/ออก งาน</h4>

      {/* การ์ด: แสดงเวลาเข้างาน + ปุ่มเช็คอิน */}
      <div className="card my-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-1">เวลาเข้างาน</h5>
            <p className="fs-5 mb-0">{checkinTime || "--:--"}</p> {/* ถ้ายังไม่เช็คอิน แสดง --:-- */}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCheckIn}
            disabled={hasCheckedIn || isProcessing}  /* ปิดปุ่มถ้าเช็คอินแล้ว หรือกำลังประมวลผล */
          >
            {/* ขณะกำลังยิง API และยังไม่มีเวลาเข้างาน -> แสดง "กำลังบันทึก..." */}
            {isProcessing && !checkinTime ? "กำลังบันทึก..." : "เช็คอิน"}
          </button>
        </div>
      </div>

      {/* การ์ด: แสดงเวลาออกงาน + ปุ่มเช็คเอาท์ */}
      <div className="card my-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <h5 className="fw-bold mb-1">เวลาออกงาน</h5>
            <p className="fs-5 mb-0">
              {
                checkoutTime       /* ถ้าเช็คเอาท์แล้ว: แสดงเวลา */
                  ? checkoutTime
                  : !hasCheckedIn  /* ยังไม่เช็คอิน: แจ้งให้รอเช็คอินก่อน */
                  ? "รอเช็คอิน"
                  : !attendanceData.isAfterEndWork /* เช็คอินแล้วแต่ยังไม่ถึงเวลาเลิกงาน */
                  ? "ยังไม่ถึงเวลาเลิกงาน"
                  : "ยังไม่ได้เช็คเอาท์"   /* ถึงเวลาเลิกงานแล้ว แต่ยังไม่เช็คเอาท์ */
              }
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleCheckOut}
            disabled={
              !hasCheckedIn ||  /* ยังไม่ได้เช็คอิน ห้ามเช็คเอาท์ */
              hasCheckedOut ||  /* เช็คเอาท์แล้ว ห้ามกดซ้ำ */
              isProcessing ||   /* ป้องกันกดรัวขณะประมวลผล */
              !attendanceData.isAfterEndWork /* ยังไม่ถึงเวลาเลิกงาน ห้ามเช็คเอาท์ */
            }
          >
            {/* ขณะกำลังยิง API และยังไม่มีเวลาออกงาน -> แสดง "กำลังบันทึก..." */}
            {isProcessing && !checkoutTime ? "กำลังบันทึก..." : "เช็คเอาท์"}
          </button>
        </div>
      </div>
    </>
  );
}
export default ClockInOut;
