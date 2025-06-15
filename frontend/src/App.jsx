// frontend/src/App.jsx

import './App.css' // คุณอาจจะมีไฟล์ css ของตัวเองด้วย

function App() {
  return (
    <div className="container mt-5"> {/* ใช้ container ของ Bootstrap */}
      <h1>ยินดีต้อนรับสู่โปรเจกต์ใหม่!</h1>
      <p>นี่คือตัวอย่างการใช้งาน Bootstrap ในโปรเจกต์ React</p>

      <button className="btn btn-primary me-2">
        ปุ่มหลัก (Primary)
      </button>

      <button className="btn btn-success">
        ปุ่มสำเร็จ (Success)
      </button>
    </div>
  )
}

export default App