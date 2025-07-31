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
import LeaveRequestListPage from './pages/Leavework/LeaveRequestListPage.jsx';
import LeaveRequestPage from './pages/Leavework/LeaveRequestPage.jsx';
import MyLeaveHistoryPage from './pages/Leavework/MyLeaveHistoryPage.jsx';
import LeaveRequestHistoryPage from './pages/Leavework/LeaveRequestHistoryPage.jsx';
import SalaryListPage from './pages/Salary/SalaryListPage.jsx';
import SalaryEditPage from './pages/Salary/SalaryEditPage.jsx';
import MySalaryPage from './pages/Salary/MySalaryPage.jsx';
import EvaluationPage from './pages/Evaluations/EvaluationPage.jsx';
import EvaluationFormPage from './pages/Evaluations/EvaluationFormPage.jsx';
import EvaluationHistoryPage from './pages/Evaluations/EvaluationHistoryPage.jsx';
import EvaluationResultPage from './pages/Evaluations/EvaluationResultPage.jsx';
import PositionListPage from './pages/Jobpos/PositionListPage.jsx';
import PositionDetailPage from './pages/Jobpos/PositionDetailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import ProfilePage from './pages/Employees/ProfilePage.jsx';
import RegisterUserPage from './pages/Auth/RegisterUserPage.jsx';

import CompanyApprovalPage from './pages/Admin/CompanyApprovalPage.jsx';
import CompanyDetailPage from './pages/Admin/CompanyDetailPage.jsx';
import CompanyListPage from './pages/Admin/CompanyListPage.jsx';
import CompanyRequestPage from './pages/Admin/CompanyRequestPage.jsx';

// Import Job Posting Pages
import JobPostingListPage from './pages/JobPostings/JobPostingListPage.jsx';
import JobPostingFormPage from './pages/JobPostings/JobPostingFormPage.jsx';
import JobPostingDetailPage from './pages/JobPostings/JobPostingDetailPage.jsx';
import PublicJobPostingListPage from './pages/JobPostings/PublicJobPostingListPage.jsx'; // <-- เพิ่ม
import PublicJobPostingDetailPage from './pages/JobPostings/PublicJobPostingDetailPage.jsx'; // <-- เพิ่ม

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
                path: "my-leave-history",
                element: <MyLeaveHistoryPage />
            },
            {
                path: "leave-requests/history",
                element: <LeaveRequestHistoryPage />
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
            },
            {
                path: "positions/view/:id",
                element: <PositionDetailPage />
            },
            {
                path: "settings",
                element: <SettingsPage />
            },
            {
                path: "admin/companies",
                element: <CompanyApprovalPage />,
            },
            {
                path: "admin/companies/:id",
                element: <CompanyDetailPage />,
            },
            {
                path: "admin/companies/all",
                element: <CompanyListPage />,
            },
            {
                path: "admin/companies/requests",
                element: <CompanyRequestPage />,
            },
            // --- Job Posting Routes (Protected for HR/Admin) ---
            {
                path: "job-postings",
                element: <JobPostingListPage />, // รายการประกาศสำหรับ HR/Admin
            },
            {
                path: "job-postings/add",
                element: <JobPostingFormPage />, // เพิ่มประกาศ
            },
            {
                path: "job-postings/edit/:id",
                element: <JobPostingFormPage />, // แก้ไขประกาศ
            },
            {
                path: "job-postings/view/:id",
                element: <JobPostingDetailPage />, // ดูรายละเอียดประกาศสำหรับ HR/Admin
            },
        ],
    },
    {
        path: "/login",
        element: <LoginPage />,
    },
    {
        path: "/register",
        element: <RegisterUserPage />,
    },
    // --- Public Job Posting Routes (Unprotected) ---
    {
        path: "/public/job-postings",
        element: <PublicJobPostingListPage />, // รายการประกาศสำหรับ Public
    },
    {
        path: "/public/job-postings/:id",
        element: <PublicJobPostingDetailPage />, // รายละเอียดประกาศสำหรับ Public
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
