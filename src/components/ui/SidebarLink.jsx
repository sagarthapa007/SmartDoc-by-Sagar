// src/components/ui/SidebarLink.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";

function getIconComponent(name) {
  const Fallback = Icons.Circle;
  return Icons[name] || Fallback;
}

export default function SidebarLink({ to, icon, label, active, onClick }) {
  const Icon = getIconComponent(icon);
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all",
          isActive || active
            ? "border-transparent bg-[var(--panel)] ring-1 ring-inset ring-[var(--brandA)]/20 shadow-[0_0_0_1px_theme(colors.blue.500/0.15),0_4px_20px_-4px_theme(colors.blue.500/0.25)]"
            : "border-transparent hover:bg-[var(--panel)] hover:border-[var(--border)]",
        ].join(" ")
      }
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--brandA)]/10 text-[var(--brandA)] ring-1 ring-inset ring-[var(--brandA)]/20">
        <Icon size={16} />
      </span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  );
}
