 
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

// ฟังก์ชันหลักของแอป (Component หลักชื่อว่า App)
function App() {
  return (
    // ส่วน UI ที่จะแสดงบนหน้าเว็บ
    <div className="container mt-4">
      <h1>ทดสอบการติดตั้ง Bootstrap</h1>
      <p>ถ้าปุ่มด้านล่างเป็นสีน้ำเงิน แสดงว่าติดตั้งสำเร็จ!</p>
      <button className="btn btn-primary">
        ติดตั้งสำเร็จ!
      </button>
    </div>
  )
}
// ส่งออกคอมโพเนนต์ App เพื่อให้ไฟล์ main.jsx นำไป render แสดงในหน้าเว็บ
export default App