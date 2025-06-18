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

// Import Layout และ Pages ทั้งหมดที่จำเป็น
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import EmployeeListPage from './pages/EmployeeListPage.jsx';
import EmployeeDetailPage from './pages/EmployeeDetailPage.jsx'; // <-- 1. Import เข้ามา
import EmployeeEditPage from './pages/EmployeeEditPage.jsx';   // <-- 1. Import เข้ามา

// สร้าง "แผนที่" ของเว็บไซต์
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "employees",
        element: <EmployeeListPage />,
      },
      // --- 2. เพิ่ม 2 Routes ใหม่เข้ามาตรงนี้ ---
      {
        path: "employees/view/:id", // :id คือ URL Parameter ที่จะเปลี่ยนไปตามพนักงาน
        element: <EmployeeDetailPage />,
      },
      {
        path: "employees/edit/:id",
        element: <EmployeeEditPage />,
      },
      // ------------------------------------
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