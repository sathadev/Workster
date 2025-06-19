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
import EmployeeListPage from './pages/Employees/EmployeeListPage.jsx';
import EmployeeDetailPage from './pages/Employees/EmployeeDetailPage.jsx';
import EmployeeEditPage from './pages/Employees/EmployeeEditPage.jsx';
import EmployeeAddPage from './pages/Employees/EmployeeAddPage.jsx';
import LeaveRequestListPage from './pages/LeaveRequestListPage.jsx';
import LeaveRequestPage from './pages/LeaveRequestPage.jsx';
import SalaryListPage from './pages/SalaryListPage.jsx';
import SalaryEditPage from './pages/SalaryEditPage.jsx';
import ProfilePage from './pages/Employees/ProfilePage.jsx';
import MySalaryPage from './pages/MySalaryPage.jsx';
import EvaluationPage from './pages/EvaluationPage.jsx';
import EvaluationFormPage from './pages/EvaluationFormPage.jsx';
import EvaluationHistoryPage from './pages/EvaluationHistoryPage.jsx';
import EvaluationResultPage from './pages/EvaluationResultPage.jsx';
import PositionListPage from './pages/PositionListPage.jsx';
import PositionDetailPage from './pages/PositionDetailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';


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
      {
        path: "employees/view/:id",
        element: <EmployeeDetailPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />
      },
      {
        path: "employees/edit/:id",
        element: <EmployeeEditPage />,
      },
      {
        path: "employees/add",
        element: <EmployeeAddPage />
      },
      {
        path: "leave-requests",
        element: <LeaveRequestListPage />
      },
      {
        path: "leave-request/new",
        element: <LeaveRequestPage />
      },
      {
        path: "salaries",
        element: <SalaryListPage />
      },
      {
        path: "salaries/edit/:empId",
        element: <SalaryEditPage />
      },
      {
        path: "my-salary",
        element: <MySalaryPage />
      },
      {
        path: "evaluations",
        element: <EvaluationPage />
      },
      {
        path: "evaluations/form/:empId",
        element: <EvaluationFormPage />
      },
      {
        path: "evaluations/history",
        element: <EvaluationHistoryPage />
      },
      {
        path: "evaluations/result/:id",
        element: <EvaluationResultPage />
      },
      {
        path: "positions",
        element: <PositionListPage />
      }, // <-- เพิ่มบรรทัดนี้
      {
        path: "positions/view/:id",
        element: <PositionDetailPage />
      },
      { 
        path: "settings", 
        element: <SettingsPage /> 
      }

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