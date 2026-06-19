import { Route, Routes } from "react-router-dom";

// Public Pages
import HomePage from "./pages/public/HomePage.jsx";
import ClassDetailPage from "./pages/public/ClassDetailPage.jsx";

// Auth Pages
import LoginPage from "./pages/auth/login.jsx";
import RegisterPage from "./pages/auth/register.jsx";
import VerifyOtpPage from "./pages/auth/verifyOtp.jsx";

// Protected Pages
import MyClassesPage from "./pages/user/myClasses.jsx";
import ClassManagement from "./pages/admin/classManagement.jsx";
import { ProtectedRoute } from "./routes/protectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      {/* Các trang Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/classes/:id" element={<ClassDetailPage />} />

      {/* Các trang Xác thực */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* Trang bắt buộc Đăng nhập */}
      <Route
        path="/user/dashboard"
        element={<ProtectedRoute><MyClassesPage /></ProtectedRoute>}
      />
      <Route
        path="/admin/classes"
        element={<ProtectedRoute roles={["admin"]}><ClassManagement /></ProtectedRoute>}
      />
    </Routes>
  );
}
