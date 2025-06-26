// frontend/src/components/EvaluationQuestion.jsx
import React from 'react';

function EvaluationQuestion({ questionNumber, title, weight, selectedValue, onChange }) {
    const questionName = `q${questionNumber}`;
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
                            name={questionName}
                            id={`${questionName}_${option.value}`}
                            value={option.value}
                            checked={selectedValue === String(option.value)}
                            onChange={onChange}
                            required
                        />
                        <label className="form-check-label d-flex justify-content-between" htmlFor={`${questionName}_${option.value}`} style={{ width: '100%' }}>
                            <span>{option.label}</span>
                            <span>({option.value} คะแนน)</span>
                        </label>
                    </div>
                ))}
            </td>
            <td className="text-center align-middle">{weight}</td>
        </tr>
    );
}

export default EvaluationQuestion;