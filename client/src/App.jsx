import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "./pages/public/HomePage.jsx";
import ClassDetailPage from "./pages/public/ClassDetailPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import VerifyOtpPage from "./pages/auth/verifyOtp.jsx";
import MyClassesPage from "./pages/user/MyClassesPage.jsx";
import ClassManagement from "./pages/admin/classManagement.jsx";
import { ProtectedRoute } from "./routes/protectedRoute.jsx";

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
        <Route
          path="/user/dashboard"
          element={<ProtectedRoute><MyClassesPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/classes"
          element={<ProtectedRoute roles={["admin"]}><ClassManagement /></ProtectedRoute>}
        />
      </Routes>
    </>
  );
}
