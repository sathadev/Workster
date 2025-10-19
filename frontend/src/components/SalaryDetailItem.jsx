// frontend/src/components/SalaryDetailItem.jsx

// Component สำหรับแสดงรายละเอียดเงินเดือนของพนักงานแบบอ่านอย่างเดียว (readonly)
function SalaryDetailItem({ label, value, unit = 'บาท', className = '' }) {
    
    // ฟังก์ชันจัดรูปแบบตัวเลขให้เป็นสกุลเงินไทย
    const formatCurrency = (num) => 
        num 
        ? Number(num).toLocaleString('th-TH', {  // ใช้มาตรฐานตัวเลขไทย
            minimumFractionDigits: 2,             // แสดงทศนิยมอย่างน้อย 2 ตำแหน่ง
            maximumFractionDigits: 2              // แสดงทศนิยมไม่เกิน 2 ตำแหน่ง
        }) 
        : '0.00';                                 // ถ้าไม่มีค่าให้แสดงเป็น 0.00

    return (
        // 🔹 กล่องแสดงข้อมูลแต่ละรายการ เช่น “เงินเดือนพื้นฐาน”, “เบี้ยขยัน”
        <div className="mb-3">
            {/* ป้ายกำกับชื่อรายการ */}
            <label className="form-label text-muted">{label}</label>

            {/* แสดงค่าของรายการแบบข้อความ (ไม่ใช่ input) */}
            <p className={`form-control-plaintext ps-3 ${className}`}>
                {/* แสดงค่าที่ฟอร์แมตแล้ว พร้อมหน่วย (เช่น บาท) */}
                {formatCurrency(value)} {unit}
            </p>
        </div>
    );
}

export default SalaryDetailItem;
