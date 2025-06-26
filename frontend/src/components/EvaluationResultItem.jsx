// frontend/src/components/EvaluationResultItem.jsx

function EvaluationResultItem({ questionNumber, title, score }) {
    const options = [
        { label: 'ดีมาก', value: 20 },
        { label: 'ดี', value: 15 },
        { label: 'พอใช้', value: 10 },
        { label: 'ควรปรับปรุง', value: 5 },
    ];

    return (
        <tr>
            <td className="text-start">
                <strong>ข้อที่ {questionNumber} {title}</strong>
                <span className="d-block ms-0 mb-2 text-muted">คำตอบ</span>
                {options.map(option => (
                    <div className="form-check ms-3" key={option.value}>
                        <input
                            className="form-check-input"
                            type="radio"
                            id={`q${questionNumber}_${option.value}`}
                            value={option.value}
                            checked={score === option.value}
                            disabled // ทำให้อ่านได้อย่างเดียว
                        />
                        <label className="form-check-label d-flex justify-content-between" htmlFor={`q${questionNumber}_${option.value}`} style={{ width: '100%' }}>
                            <span>{option.label}</span>
                            <span>({option.value} คะแนน)</span>
                        </label>
                    </div>
                ))}
            </td>
            <td className="text-center align-middle">{score}</td>
        </tr>
    );
}

export default EvaluationResultItem;