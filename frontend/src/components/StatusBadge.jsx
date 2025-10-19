// frontend/src/components/StatusBadge.jsx
import React from 'react';

function StatusBadge({ status }) {
    //  แม็ปสถานะ -> ข้อความที่จะแสดง + คลาสสีของ Bootstrap
    const statusMap = {
        pending:  { text: 'รอดำเนินการ', bg: 'bg-warning text-dark' },
        approved: { text: 'อนุมัติ',      bg: 'bg-success' },
        rejected: { text: 'ไม่อนุมัติ',    bg: 'bg-danger' },
    };

    //  เลือกค่าที่ต้องใช้ตาม props "status"
    //  ถ้าไม่ตรงกับที่กำหนดไว้ ให้ใช้สีเทา (secondary) และแสดงข้อความเป็นค่า status ตรงๆ
    const currentStatus = statusMap[status] || { text: status, bg: 'bg-secondary' };

    return (
        //  แสดง badge ด้วยคลาสสีจาก currentStatus.bg และข้อความ currentStatus.text
        <span className={`badge ${currentStatus.bg}`}>{currentStatus.text}</span>
    );
}

export default StatusBadge;
