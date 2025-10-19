// frontend/src/components/EmployeeInfo.jsx

// ฟังก์ชันช่วย: แปลงวันที่ (string) -> รูปแบบไทย 
function formatDate(dateString) {
    if (!dateString) return ''; // ถ้าไม่มีค่า ให้คืนค่าว่าง
    const date = new Date(dateString); // แปลงเป็น Date object
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }); // ฟอร์แมตแบบไทย
}

function EmployeeInfo({ employee }) {
    if (!employee) return null; // ถ้าไม่มีข้อมูล employee ไม่ต้องแสดงอะไร (กัน error)

    // กำหนด URL สำหรับไฟล์รูปโปรไฟล์ที่เซิร์ฟเวอร์เสิร์ฟ (ต้องตรงกับ static path ในฝั่ง Express)
    const BASE_URL_UPLOAD = 'http://localhost:5000/uploads/profile_pics/'; 
    return (
        <div className="row align-items-center"> {/* แถวหลัก จัดแนวกลางแนวตั้ง */}
            <div className="col-md-3 text-center mb-3"> {/* คอลัมน์ซ้าย: รูปโปรไฟล์ */}
                <img 
                    // ถ้ามีชื่อไฟล์รูป (employee.emp_pic) ให้ประกอบเป็น URL เต็ม
                    // ถ้าไม่มี ให้ใช้รูป default ใน public (/images/profile.jpg)
                    src={employee.emp_pic ? `${BASE_URL_UPLOAD}${employee.emp_pic}` : '/images/profile.jpg'}
                    alt="Profile"
                    className="rounded-circle border"  // ทำเป็นวงกลม + เส้นขอบบาง ๆ
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }} // ขนาดคงที่ ครอบให้เต็ม
                />
            </div>

            <div className="col-md-9 profile-details"> {/* คอลัมน์ขวา: รายละเอียดพนักงาน */}
                {/* แถวละฟิลด์: ซ้ายคือ label, ขวาคือค่า */}
                <div className="row">
                    <div className="col-sm-4 col-md-3 label">ชื่อ - สกุล :</div>
                    <div className="col-sm-8 col-md-9">{employee.emp_name}</div>
                </div>

                <div className="row">
                    <div className="col-sm-4 col-md-3 label">ตำแหน่ง :</div>
                    <div className="col-sm-8 col-md-9">{employee.jobpos_name}</div>
                </div>

                <div className="row">
                    <div className="col-sm-4 col-md-3 label">Email :</div>
                    <div className="col-sm-8 col-md-9">{employee.emp_email}</div>
                </div>

                <div className="row">
                    <div className="col-sm-4 col-md-3 label">เบอร์โทร :</div>
                    <div className="col-sm-8 col-md-9">{employee.emp_tel}</div>
                </div>

                <div className="row">
                    <div className="col-sm-4 col-md-3 label">ที่อยู่ :</div>
                    <div className="col-sm-8 col-md-9">{employee.emp_address}</div>
                </div>

                <div className="row">
                    <div className="col-sm-4 col-md-3 label">วันเกิด :</div>
                    {/* ใช้ formatDate เพื่อให้เป็นรูปแบบไทย */}
                    <div className="col-sm-8 col-md-9">{formatDate(employee.emp_birthday)}</div>
                </div>

                <div className="row">
                    <div className="col-sm-4 col-md-3 label">วันที่เริ่มงาน :</div>
                    {/* ใช้ formatDate เช่นเดียวกัน */}
                    <div className="col-sm-8 col-md-9">{formatDate(employee.emp_startwork)}</div>
                </div>
            </div>
        </div>
    );
}
export default EmployeeInfo;
