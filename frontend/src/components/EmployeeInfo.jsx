// frontend/src/components/EmployeeInfo.jsx

function arrayBufferToBase64(buffer) {
    if (!buffer || !buffer.data) return '';
    let binary = '';
    const bytes = new Uint8Array(buffer.data);
    for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); }
    return window.btoa(binary);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
}

function EmployeeInfo({ employee }) {
    if (!employee) return null;
    return (
        <div className="row align-items-center">
            <div className="col-md-3 text-center mb-3">
                <img 
                    src={employee.emp_pic ? `data:image/jpeg;base64,${arrayBufferToBase64(employee.emp_pic)}` : '/images/profile.jpg'}
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
