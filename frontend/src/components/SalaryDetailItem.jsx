// frontend/src/components/SalaryDetailItem.jsx

function SalaryDetailItem({ label, value, unit = 'บาท', className = '' }) {
    const formatCurrency = (num) => 
        num ? Number(num).toLocaleString('th-TH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }) : '0.00';

    return (
        <div className="mb-3">
            <label className="form-label text-muted">{label}</label>
            <p className={`form-control-plaintext ps-3 ${className}`}>
                {formatCurrency(value)} {unit}
            </p>
        </div>
    );
}

export default SalaryDetailItem;