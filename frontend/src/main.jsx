import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// CSS & Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";

// Context
import { AuthProvider } from "./context/AuthContext";

// Layout & Components
import MainLayout from "./layouts/MainLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Pages (ระบบ HR)
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import EmployeeListPage from "./pages/Employees/EmployeeListPage.jsx";
import EmployeeDetailPage from "./pages/Employees/EmployeeDetailPage.jsx";
import EmployeeEditPage from "./pages/Employees/EmployeeEditPage.jsx";
import EmployeeAddPage from "./pages/Employees/EmployeeAddPage.jsx";
import LeaveRequestListPage from "./pages/Leavework/LeaveRequestListPage.jsx";
import LeaveRequestPage from "./pages/Leavework/LeaveRequestPage.jsx";
import MyLeaveHistoryPage from "./pages/Leavework/MyLeaveHistoryPage.jsx";
import LeaveRequestHistoryPage from "./pages/Leavework/LeaveRequestHistoryPage.jsx";
import SalaryListPage from "./pages/Salary/SalaryListPage.jsx";
import SalaryEditPage from "./pages/Salary/SalaryEditPage.jsx";
import MySalaryPage from "./pages/Salary/MySalaryPage.jsx";
import EvaluationPage from "./pages/Evaluations/EvaluationPage.jsx";
import EvaluationFormPage from "./pages/Evaluations/EvaluationFormPage.jsx";
import EvaluationHistoryPage from "./pages/Evaluations/EvaluationHistoryPage.jsx";
import EvaluationResultPage from "./pages/Evaluations/EvaluationResultPage.jsx";
import PositionListPage from "./pages/Jobpos/PositionListPage.jsx";
import PositionDetailPage from "./pages/Jobpos/PositionDetailPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import ProfilePage from "./pages/Employees/ProfilePage.jsx";
import RegisterUserPage from "./pages/Auth/RegisterUserPage.jsx";

// Admin
import CompanyApprovalPage from "./pages/Admin/CompanyApprovalPage.jsx";
import CompanyDetailPage from "./pages/Admin/CompanyDetailPage.jsx";
import CompanyListPage from "./pages/Admin/CompanyListPage.jsx";
import CompanyRequestPage from "./pages/Admin/CompanyRequestPage.jsx";

// Jobs (Public/HR)
import JobPostingListPage from "./pages/JobPostings/JobPostingListPage.jsx";
import JobPostingFormPage from "./pages/JobPostings/JobPostingFormPage.jsx";
import JobPostingDetailPage from "./pages/JobPostings/JobPostingDetailPage.jsx";
import PublicJobPostingListPage from "./pages/Public/PublicJobPostingListPage.jsx";
import PublicJobPostingDetailPage from "./pages/Public/PublicJobPostingDetailPage.jsx";
import PublicJobApplicationPage from "./pages/Public/PublicJobApplicationPage.jsx";
import HrApplicantsPage from "./pages/hr/HrApplicantsPage.jsx";
import HrApplicantDetailPage from "./pages/hr/HrApplicantDetailPage.jsx";

// 🔹 Landing Page (ใหม่ - public)
import LandingPage from "./pages/LandingPage.jsx";

// Error element
function RouteError() {
  return (
    <div className="container py-5">
      <h2 className="mb-3">404 Not Found</h2>
      <p className="text-muted">หน้านี้ไม่มีอยู่ในระบบ หรือเส้นทางไม่ถูกต้อง</p>
      <a className="btn btn-primary" href="/">
        กลับหน้าแรก
      </a>
    </div>
  );
}

// Router
const router = createBrowserRouter([
  // 🔹 หน้า Landing (public) ที่ "/"
  { path: "/", element: <LandingPage /> },

  // 🔒 โซนระบบ HR (ต้องล็อกอิน) ที่ยังคง path เดิมทั้งหมด
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteError />,
    children: [
      // เดิม index เป็น HomePage → เปลี่ยนไปใช้ /home แทน
      { path: "home", element: <HomePage /> },

      { path: "employees", element: <EmployeeListPage /> },
      { path: "employees/view/:id", element: <EmployeeDetailPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "employees/edit/:id", element: <EmployeeEditPage /> },
      { path: "employees/add", element: <EmployeeAddPage /> },

      { path: "leave-requests", element: <LeaveRequestListPage /> },
      { path: "leave-request/new", element: <LeaveRequestPage /> },
      { path: "my-leave-history", element: <MyLeaveHistoryPage /> },
      { path: "leave-requests/history", element: <LeaveRequestHistoryPage /> },

      { path: "salaries", element: <SalaryListPage /> },
      { path: "salaries/edit/:empId", element: <SalaryEditPage /> },
      { path: "my-salary", element: <MySalaryPage /> },

      { path: "evaluations", element: <EvaluationPage /> },
      { path: "evaluations/form/:empId", element: <EvaluationFormPage /> },
      { path: "evaluations/history", element: <EvaluationHistoryPage /> },
      { path: "evaluations/result/:id", element: <EvaluationResultPage /> },

      { path: "positions", element: <PositionListPage /> },
      { path: "positions/view/:id", element: <PositionDetailPage /> },

      { path: "settings", element: <SettingsPage /> },

      { path: "job-postings", element: <JobPostingListPage /> },
      { path: "job-postings/add", element: <JobPostingFormPage /> },
      { path: "job-postings/edit/:id", element: <JobPostingFormPage /> },
      { path: "job-postings/view/:id", element: <JobPostingDetailPage /> },

      { path: "hr/applicants", element: <HrApplicantsPage /> },
      { path: "hr/applicants/:applicationId", element: <HrApplicantDetailPage /> },

      // Admin
      { path: "admin/companies", element: <CompanyApprovalPage /> },
      { path: "admin/companies/:id", element: <CompanyDetailPage /> },
      { path: "admin/companies/all", element: <CompanyListPage /> },
      { path: "admin/companies/requests", element: <CompanyRequestPage /> },
    ],
  },

  // Public auth & public jobs
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterUserPage /> },

  { path: "/public/job-postings", element: <PublicJobPostingListPage /> },
  { path: "/public/job-postings/:id", element: <PublicJobPostingDetailPage /> },
  { path: "/public/job-applications/:id", element: <PublicJobApplicationPage /> },

  // 404
  { path: "*", element: <RouteError /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);
