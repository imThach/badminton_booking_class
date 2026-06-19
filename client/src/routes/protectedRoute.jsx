import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

export function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, isLoadingUser, user } = useAuth();
  const location = useLocation();

  if (isLoadingUser) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles?.length && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
