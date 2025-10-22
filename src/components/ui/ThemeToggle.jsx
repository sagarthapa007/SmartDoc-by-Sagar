import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext.jsx";

export default function ThemeToggle() {
  const { dark, toggle } = useTheme(); // ✅ matches your ThemeContext
  const isDark = dark;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-elevated)] transition-all duration-200 shadow-sm hover:shadow-md"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} className="text-blue-600" />
      )}
    </button>
  );
}
