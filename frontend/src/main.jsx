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
import MainLayout from './layouts/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import HomePage from './pages/HomePage.jsx';
import EmployeeListPage from './pages/EmployeeListPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // <-- 1. Import "ยาม" เข้ามา

// สร้าง "แผนที่" ของเว็บไซต์
const router = createBrowserRouter([
  {
    path: "/",
    // vvv 2. ให้ "ยาม" (ProtectedRoute) มาห่อหุ้ม Layout หลักของเรา vvv
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
      // ในอนาคต Route ลูกๆ ที่ต้องล็อกอินก่อนจะถูกเพิ่มที่นี่
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