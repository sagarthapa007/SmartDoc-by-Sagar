import React from "react";
export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="text-5xl mb-3">🚫</div>
        <h2 className="text-xl font-semibold mb-1">Access Restricted</h2>
        <p className="text-gray-500">You don't have permission to view this page.</p>
      </div>
    </div>
  );
}
