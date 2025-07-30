import { useState } from 'react'
// ลบ import รูป reactLogo, viteLogo ถ้าไม่ได้ใช้จริง
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css' // ยังคง import App.css ไว้ (ตามโค้ดต้นฉบับ)

function App() {
  return (
    <div className="container mt-5 text-center"> {/* เพิ่ม mt-5 เพื่อให้มีระยะห่างด้านบน, text-center เพื่อจัดกึ่งกลาง */}
      <h1 className="fw-bold text-dark mb-3" style={{ fontSize: '2.5rem' }}>ทดสอบการติดตั้ง Bootstrap WorkSter</h1> {/* ปรับขนาดและสี */}
      <p className="lead text-secondary mb-4" style={{ fontSize: '1.2rem' }}>ถ้าปุ่มด้านล่างเป็นสีน้ำเงินเข้มและมีฟอนต์ไทย แสดงว่าติดตั้งสำเร็จ!</p> {/* ปรับขนาดและสี */}
      <button className="btn btn-primary btn-lg fw-bold" style={{ fontSize: '1.1rem' }}> {/* ใช้ btn-lg และปรับขนาดฟอนต์ */}
        ติดตั้งสำเร็จ!
      </button>
      {/* ถ้าต้องการเพิ่ม logo WorkSter เหมือน landing page */}
      {/* <img src="/images/logo.png" alt="WorkSter Logo" style={{ width: '150px', marginTop: '3rem' }} /> */}
    </div>
  )
}

export default App