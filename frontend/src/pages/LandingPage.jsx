import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ถ้าล็อกอินแล้ว เด้งไป /home ทันที
  useEffect(() => {
    if (user) {
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  // Smooth scroll + ปิด Navbar collapse บนมือถือเมื่อคลิกลิงก์
  useEffect(() => {
    const handler = (e) => {
      const a = e.target.closest('a.nav-link[href^="#"]');
      if (!a) return;

      const id = a.getAttribute("href").slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        const nav = document.getElementById("wsNav");
        if (nav && nav.classList.contains("show") && window.bootstrap) {
          new window.bootstrap.Collapse(nav).hide();
        }
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark sticky-top" style={{ backgroundColor: "#212529" }}>
        <div className="container">
          <a className="navbar-brand" href="#home" aria-label="WorkSter Home">WorkSter</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#wsNav" aria-controls="wsNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="wsNav" className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto align-items-lg-center">
              <li className="nav-item"><a className="nav-link active" href="#home">หน้าหลัก</a></li>
              <li className="nav-item"><a className="nav-link" href="#features">คุณสมบัติ</a></li>
              <li className="nav-item"><a className="nav-link" href="#about">เกี่ยวกับเรา</a></li>
              <li className="nav-item"><a className="nav-link" href="#contact">ติดต่อ</a></li>
              <li className="nav-item ms-lg-3">
                <button className="btn btn-primary btn-sm" onClick={() => navigate("/register")}>
                  <i className="fas fa-user-plus me-2" aria-hidden="true"></i>สมัครใช้บริการ
                </button>
              </li>
              <li className="nav-item ms-lg-2">
                <button className="btn btn-outline-light btn-sm" onClick={() => navigate("/login")}>
                  <i className="fas fa-sign-in-alt me-2" aria-hidden="true"></i>เข้าสู่ระบบ
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <style>{`
        :root{--ws-primary:#1E56A0;--ws-accent:#3E8DCF;--ws-text:#333;--ws-shadow:0 10px 30px rgba(0,0,0,.08);--ws-shadow-lg:0 15px 40px rgba(0,0,0,.12)}
        body{font-family:'Noto Sans Thai', sans-serif}
        .hero{background:linear-gradient(90deg,var(--ws-primary),var(--ws-accent)); color:#fff; padding:7rem 0 6rem}
        .hero-title{font-size:3rem; font-weight:700; text-shadow:2px 2px 4px rgba(0,0,0,.25)}
        .hero-subtitle{font-size:1.125rem; max-width:880px; margin:1rem auto 2.5rem}
        .btn-hero{border-radius:999px; padding:.9rem 2rem; font-weight:600}
        .features{background:#fff; padding:4.5rem 0}
        .feature-card{border:none; border-radius:.75rem; padding:2rem; text-align:center; box-shadow:var(--ws-shadow); transition:transform .2s, box-shadow .2s}
        .feature-card:hover{transform:translateY(-4px); box-shadow:var(--ws-shadow-lg)}
        .feature-icon{font-size:2.75rem; color:var(--ws-primary); margin-bottom:1rem}
        .feature-title{color:var(--ws-primary); font-weight:700}
        .about{background:#e9ecef; padding:4.5rem 0}
        .cta{background:#1E56A0; color:#fff; text-align:center; padding:4rem 0}
        footer.footer{background:#343a40; color:#bbb; font-size:.95rem; padding:2rem 0}
        footer.footer a{color:#bbb; text-decoration:none}
        footer.footer a:hover{color:#fff}
        :target{scroll-margin-top:80px}
        @media(max-width:768px){
          .hero{padding:5.5rem 0 4.5rem}
          .hero-title{font-size:2.4rem}
          .btn-hero{display:block; width:100%; max-width:420px; margin:.5rem auto}
        }
      `}</style>

      <section id="home" className="hero">
        <div className="container text-center">
          <h1 className="hero-title">บริหารงานบุคคลยุคใหม่ <br className="d-none d-md-block" />ครบ จบ ในที่เดียว</h1>
          <p className="hero-subtitle">
            WorkSter คือ HR Management System สำหรับธุรกิจไทย จัดการพนักงาน เงินเดือน การลา ประเมินผล และรับสมัครงาน ครบในระบบเดียว
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button className="btn btn-primary btn-hero" onClick={() => navigate("/register")}>
              <i className="fas fa-user-plus me-2" aria-hidden="true"></i>เริ่มต้นใช้งานฟรี
            </button>
            <button className="btn btn-outline-light btn-hero" onClick={() => navigate("/login")}>
              <i className="fas fa-sign-in-alt me-2" aria-hidden="true"></i>เข้าสู่ระบบ
            </button>
            <button className="btn btn-outline-light btn-hero" onClick={() => navigate("/public/job-postings")}>
              <i className="fas fa-briefcase me-2" aria-hidden="true"></i>สมัครงาน
            </button>
          </div>
        </div>
      </section>

      <section id="features" className="features">
        <div className="container">
          <h2 className="text-center mb-5 feature-title">คุณสมบัติเด่นของ WorkSter</h2>
        <div className="row g-4">
          {[
            {icon:"users", title:"จัดการข้อมูลพนักงาน", desc:"เก็บข้อมูลครบถ้วน ค้นหาไว พร้อมประวัติและไฟล์แนบ"},
            {icon:"dollar-sign", title:"เงินเดือนและค่าตอบแทน", desc:"คำนวณภาษี/ประกันสังคม ออกรายงานทันที"},
            {icon:"calendar-alt", title:"การจัดการการลา", desc:"ยื่น อนุมัติ ติดตามสถานะ ได้ทุกที่ทุกเวลา"},
            {icon:"chart-line", title:"ประเมินผลการทำงาน", desc:"กำหนด KPI/OKR และติดตามความคืบหน้า"},
            {icon:"bullhorn", title:"รับสมัครงาน", desc:"โพสต์งาน คัดกรองผู้สมัคร นัดสัมภาษณ์"},
            {icon:"cogs", title:"ปรับแต่งได้ยืดหยุ่น", desc:"ตั้งค่าตามโครงสร้างและนโยบายของบริษัท"},
          ].map((f,i)=>(
            <div className="col-md-4" key={i}>
              <div className="feature-card h-100">
                <i className={`fas fa-${f.icon} feature-icon`} aria-hidden="true"></i>
                <h3 className="h5 feature-title">{f.title}</h3>
                <p className="mb-0">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section id="about" className="about">
        <div className="container">
          <h2 className="text-center mb-5 feature-title">เกี่ยวกับ WorkSter</h2>
          <div className="row align-items-center">
            <div className="col-md-6 text-center mb-4 mb-md-0">
              <img src="/images/logo.png" alt="โลโก้ WorkSter" className="img-fluid" style={{maxWidth:"80%"}} loading="lazy" />
            </div>
            <div className="col-md-6">
              <p className="lead">
                WorkSter มุ่งมั่นพัฒนาโซลูชัน HR สำหรับองค์กรทุกขนาด
                เพื่อยกระดับประสิทธิภาพการจัดการบุคลากรให้เติบโตได้อย่างยั่งยืน
              </p>
              <p>
                ระบบถูกออกแบบโดยทีมที่เข้าใจทั้งมุมมอง HR และเทคโนโลยี
                พร้อมปรับให้เข้ากับบริบทของธุรกิจไทยในยุคดิจิทัล
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="cta">
        <div className="container text-center">
          <h2 className="hero-title mb-3">พร้อมยกระดับงาน HR ของคุณหรือยัง?</h2>
          <p className="hero-subtitle mb-4">เริ่มประสบการณ์ใหม่กับ WorkSter วันนี้ — ทดลองใช้งานฟรี</p>
          <button className="btn btn-outline-light btn-hero" onClick={() => navigate("/register")}>
            <i className="fas fa-clipboard-list me-2" aria-hidden="true"></i>สมัครใช้งานฟรี!
          </button>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="row gy-2 align-items-center">
            <div className="col-md-6 text-center text-md-start">
              &copy; 2025 WorkSter. All rights reserved.
            </div>
            <div className="col-md-6 text-center text-md-end">
              <a href="#home" className="me-3">หน้าหลัก</a>
              <a href="#features" className="me-3">คุณสมบัติ</a>
              <a href="#about" className="me-3">เกี่ยวกับเรา</a>
              <a href="mailto:info@workster.com">ติดต่อเรา</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
