// frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Import CSS หลักและ Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './index.css';

// Import Context Provider
import { AuthProvider } from './context/AuthContext';

// Import Layout และ Pages
import MainLayout from './layouts/MainLayout.jsx'; // <-- CHANGED: Import Layout ใหม่
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import EmployeeListPage from './pages/EmployeeListPage.jsx';

// สร้าง "แผนที่" ของเว็บไซต์
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />, // <-- CHANGED: ใช้ MainLayout เป็นกรอบ
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "employees",
        element: <EmployeeListPage />,
      },
      // ในอนาคตเราจะเพิ่ม Route ลูกๆ ที่นี่ เช่น
      // { path: "employees", element: <EmployeeListPage /> },
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);


// สั่งให้แอปของเราทำงาน
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
);