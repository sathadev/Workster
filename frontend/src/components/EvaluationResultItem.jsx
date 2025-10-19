// frontend/src/components/EvaluationResultItem.jsx

function EvaluationResultItem({ questionNumber, title, score }) {
    // กำหนดตัวเลือกคำตอบทั้งหมดพร้อมคะแนน (เหมือนตอนทำแบบประเมิน)
    const options = [
        { label: 'ดีมาก', value: 20 },
        { label: 'ดี', value: 15 },
        { label: 'พอใช้', value: 10 },
        { label: 'ควรปรับปรุง', value: 5 },
    ];

    return (
        // 1 แถวในตารางของผลประเมิน
        <tr>
            <td className="text-start">
                {/* แสดงหัวข้อคำถาม */}
                <strong>ข้อที่ {questionNumber} {title}</strong>

                {/* แสดงข้อความกำกับว่าเป็นส่วนของคำตอบ */}
                <span className="d-block ms-0 mb-2 text-muted">คำตอบ</span>

                {/* วนลูปแสดง radio ทุกตัวเลือก (แต่ไม่สามารถกดได้) */}
                {options.map(option => (
                    <div className="form-check ms-3" key={option.value}>
                        <input
                            className="form-check-input"
                            type="radio"
                            id={`q${questionNumber}_${option.value}`} // id เฉพาะของแต่ละข้อ
                            value={option.value}                      // ค่าคะแนน
                            checked={score === option.value}           // แสดงติ๊กถูกเฉพาะค่าที่ตรงกับ score
                            disabled                                  // ปิดการแก้ไข (อ่านได้อย่างเดียว)
                        />
                        <label
                            className="form-check-label d-flex justify-content-between"
                            htmlFor={`q${questionNumber}_${option.value}`}
                            style={{ width: '100%' }}
                        >
                            {/* ด้านซ้ายชื่อระดับ เช่น "ดีมาก" ด้านขวาแสดงคะแนน */}
                            <span>{option.label}</span>
                            <span>({option.value} คะแนน)</span>
                        </label>
                    </div>
                ))}
            </td>

            {/* แสดงคะแนนที่ได้ในคอลัมน์สุดท้าย */}
            <td className="text-center align-middle">{score}</td>
        </tr>
    );
}

export default EvaluationResultItem;
