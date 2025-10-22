import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext.jsx";
import AccessDenied from "@/pages/AccessDenied.jsx";
import LoginModal from "@/components/auth/LoginModal.jsx";

export default function ProtectedRoute({ children, permission }) {
  const { isAuthenticated, hasPermission, loginOpen, setLoginOpen } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && !loginOpen) {
      setLoginOpen(true);
    }
  }, [isAuthenticated, loginOpen, setLoginOpen]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginModal />
        <div className="p-6 max-w-2xl mx-auto mt-24 text-center text-gray-600 dark:text-gray-300">
          Please sign in to continue.
        </div>
      </>
    );
  }

  if (permission && !hasPermission(permission)) {
    return <AccessDenied />;
  }

  return children;
}
