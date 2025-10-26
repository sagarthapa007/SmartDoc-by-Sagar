import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

export default function AdminRoles() {
  const { user } = useAuth();
  const demoUsers = useMemo(
    () => [
      {
        id: 1,
        name: "Sarah Johnson",
        email: "sarah@company.com",
        role: "analyst",
      },
      { id: 2, name: "Alex Doe", email: "alex@company.com", role: "user" },
      { id: 3, name: "Priya Dev", email: "priya@company.com", role: "wife" },
    ],
    [],
  );

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Role Manager (Preview)</h1>
      <p className="text-sm text-gray-500 mb-6">
        Only Admins should see & edit this in future.
      </p>
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {demoUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <button className="px-3 py-1.5 rounded-lg border">
                    Change Role
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 text-xs text-gray-500">
        Signed in as: {user?.email} ({user?.role})
      </div>
    </div>
  );
}
