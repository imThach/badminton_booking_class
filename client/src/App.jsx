import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/public/HomePage.jsx";
import ClassDetailPage from "./pages/public/ClassDetailPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import VerifyOtpPage from "./pages/auth/verifyOtp.jsx";
import MyClassesPage from "./pages/user/MyClassesPage.jsx";
import ClassManagement from "./pages/admin/classManagement.jsx";
import { ProtectedRoute } from "./routes/protectedRoute.jsx";
import ProfilePage from "./pages/user/ProfilePage.jsx";
import { ForgotPasswordPage } from "./pages/auth/PasswordResetPages.jsx";
import GoogleSignupPage from "./pages/auth/GoogleSignupPage.jsx";
import PaymentHistoryPage from "./pages/user/PaymentHistoryPage.jsx";
import PaymentResultPage from "./pages/public/PaymentResultPage.jsx";
import RefundManagementPage from "./pages/admin/RefundManagementPage.jsx";
import AuditLogPage from "./pages/admin/AuditLogPage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import SessionManagementPage from "./pages/admin/SessionManagementPage.jsx";
import SessionTransferPage from "./pages/user/SessionTransferPage.jsx";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/classes/:id" element={<ClassDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/google-signup" element={<GoogleSignupPage />} />
        <Route path="/payment-result" element={<PaymentResultPage />} />
        <Route path="/user/payments" element={<ProtectedRoute roles={["user"]}><PaymentHistoryPage /></ProtectedRoute>} />
        <Route path="/user/session-transfers" element={<ProtectedRoute roles={["user"]}><SessionTransferPage /></ProtectedRoute>} />
        <Route path="/admin/refunds" element={<ProtectedRoute roles={["admin"]}><RefundManagementPage /></ProtectedRoute>} />
        <Route path="/admin/audit-logs" element={<ProtectedRoute roles={["admin"]}><AuditLogPage /></ProtectedRoute>} />
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><AdminDashboardPage /></ProtectedRoute>} />
        <Route path="/admin/sessions" element={<ProtectedRoute roles={["admin"]}><SessionManagementPage /></ProtectedRoute>} />
        <Route
          path="/user/dashboard"
          element={<ProtectedRoute><MyClassesPage /></ProtectedRoute>}
        />
        <Route path="/user/saved" element={<Navigate to="/user/dashboard?tab=favorites" replace />} />
        <Route path="/user/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route
          path="/admin/classes"
          element={<ProtectedRoute roles={["admin"]}><ClassManagement /></ProtectedRoute>}
        />
      </Routes>
    </>
  );
}
