// frontend/src/components/EmployeeInfo.jsx

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function EmployeeInfo({ employee }) {
    if (!employee) return null;

    // กำหนด BASE_URL_UPLOAD สำหรับรูปภาพ
    // ต้องตรงกับ URL ที่ Express Serve Static Files ใน app.js
    const BASE_URL_UPLOAD = 'http://localhost:5000/uploads/profile_pics/'; // <--- เพิ่ม: URL สำหรับรูปภาพ

    return (
        <div className="row align-items-center">
            <div className="col-md-3 text-center mb-3">
                <img 
                    // เปลี่ยน src ให้ชี้ไปยังไฟล์ใน Server
                    // ถ้า employee.emp_pic มีค่า (เป็นชื่อไฟล์) ให้ใช้ URL เต็ม
                    // ถ้าไม่มีค่า ให้ใช้รูปภาพ default
                    src={employee.emp_pic ? `${BASE_URL_UPLOAD}${employee.emp_pic}` : '/images/profile.jpg'}
                    alt="Profile"
                    className="rounded-circle border" 
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
            </div>
            <div className="col-md-9 profile-details">
                <div className="row"><div className="col-sm-4 col-md-3 label">ชื่อ - สกุล :</div><div className="col-sm-8 col-md-9">{employee.emp_name}</div></div>
                <div className="row"><div className="col-sm-4 col-md-3 label">ตำแหน่ง :</div><div className="col-sm-8 col-md-9">{employee.jobpos_name}</div></div>
                <div className="row"><div className="col-sm-4 col-md-3 label">Email :</div><div className="col-sm-8 col-md-9">{employee.emp_email}</div></div>
                <div className="row"><div className="col-sm-4 col-md-3 label">เบอร์โทร :</div><div className="col-sm-8 col-md-9">{employee.emp_tel}</div></div>
                <div className="row"><div className="col-sm-4 col-md-3 label">ที่อยู่ :</div><div className="col-sm-8 col-md-9">{employee.emp_address}</div></div>
                <div className="row"><div className="col-sm-4 col-md-3 label">วันเกิด :</div><div className="col-sm-8 col-md-9">{formatDate(employee.emp_birthday)}</div></div>
                <div className="row"><div className="col-sm-4 col-md-3 label">วันที่เริ่มงาน :</div><div className="col-sm-8 col-md-9">{formatDate(employee.emp_startwork)}</div></div>
            </div>
        </div>
    );
}
export default EmployeeInfo;
