// frontend/src/components/StatusBadge.jsx
import React from 'react';

function StatusBadge({ status }) {
    const statusMap = {
        pending: { text: 'รอดำเนินการ', bg: 'bg-warning text-dark' },
        approved: { text: 'อนุมัติ', bg: 'bg-success' },
        rejected: { text: 'ไม่อนุมัติ', bg: 'bg-danger' },
    };

    const currentStatus = statusMap[status] || { text: status, bg: 'bg-secondary' };

    return (
        <span className={`badge ${currentStatus.bg}`}>{currentStatus.text}</span>
    );
}

export default StatusBadge;