import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";

export default function Protected({ children, roles }){
  const { isAuthenticated, user, loading } = useAuth();
  const loc = useLocation();
  if(loading) return <div className="p-6">Checking access…</div>;
  if(!isAuthenticated) return <Navigate to="/login" state={{ from: loc }} replace />;
  if(roles && user && !roles.includes(user.role?.name)) return <Navigate to="/" replace />;
  return children;
}
