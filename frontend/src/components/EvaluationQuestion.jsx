// frontend/src/components/EvaluationQuestion.jsx
import React from 'react';

function EvaluationQuestion({ questionNumber, title, weight, selectedValue, onChange }) {
    // ตั้งชื่อ radio group แต่ละข้อ เช่น q1, q2, q3 ...
    const questionName = `q${questionNumber}`;

    // ตัวเลือกคำตอบ 4 ระดับ พร้อมคะแนน
    const options = [
        { label: 'ดีมาก', value: 20 },
        { label: 'ดี', value: 15 },
        { label: 'พอใช้', value: 10 },
        { label: 'ควรปรับปรุง', value: 5 },
    ];

    return (
        // แสดง 1 แถวในตาราง (table row)
        <tr>
            <td className="text-start">
                {/* หัวข้อคำถาม */}
                <strong>ข้อที่ {questionNumber} {title}</strong>
                {/* ข้อความกำกับ */}
                <span className="d-block ms-0 mb-2 text-muted">คำตอบ</span>

                {/* วนลูปสร้าง radio options ทีละตัว */}
                {options.map(option => (
                    <div className="form-check ms-3" key={option.value}>
                        <input
                            className="form-check-input"
                            type="radio"
                            name={questionName}                 // ใช้ชื่อเดียวกันเพื่อให้เลือกได้ข้อเดียว
                            id={`${questionName}_${option.value}`} // id เฉพาะของแต่ละตัวเลือก
                            value={option.value}                 // ค่าคะแนนของตัวเลือก
                            checked={selectedValue === String(option.value)} // เช็คว่าข้อนี้ถูกเลือกอยู่ไหม
                            onChange={onChange}                  // ฟังก์ชันเมื่อเปลี่ยนค่า
                            required                             // บังคับต้องเลือก
                        />
                        <label
                            className="form-check-label d-flex justify-content-between"
                            htmlFor={`${questionName}_${option.value}`}
                            style={{ width: '100%' }}
                        >
                            {/* ด้านซ้ายชื่อระดับ เช่น "ดีมาก" ด้านขวาแสดงคะแนน */}
                            <span>{option.label}</span>
                            <span>({option.value} คะแนน)</span>
                        </label>
                    </div>
                ))}
            </td>

            {/* คอลัมน์แสดงน้ำหนักของคำถาม */}
            <td className="text-center align-middle">{weight}</td>
        </tr>
    );
}

export default EvaluationQuestion;
