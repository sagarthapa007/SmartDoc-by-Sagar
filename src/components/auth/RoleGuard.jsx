import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

/**
 * RoleGuard
 * - If not authenticated -> redirect to /login
 * - If roles prop is provided -> require user.role.name ∈ roles
 */
export default function RoleGuard({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (roles && roles.length && !roles.includes(user?.role?.name)) {
    // Optional: could show 403 page instead
    return <Navigate to="/" replace />;
  }
  return children;
}
