import React from "react";
import { useAuth } from "@/context/AuthContext.jsx";
export default function Settings(){
  const { user } = useAuth();
  return (
    <div className="section">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Settings</h2>
        <p>Only Admins see this in nav. Current user role: <b>{user?.role?.name}</b></p>
      </div>
    </div>
  );
}