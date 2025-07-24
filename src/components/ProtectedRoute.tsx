import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../lib/store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
}) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (requireAuth && !isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!requireAuth && isAuthenticated) {
    // Redirect authenticated users away from login/register pages
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
