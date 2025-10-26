import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Crown,
  LogOut,
  LogIn,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext.jsx";
import { useAuth } from "@/context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function SmartTopbar({ onMenu }) {
  const { dark, toggle } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchActive, setSearchActive] = useState(false);

  const firstName = user?.name || user?.full_name || "Guest";
  const initials = (firstName || "G")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 z-50 backdrop-blur-xl shadow-[var(--shadow-sm)] border-b"
      style={{
        background: "var(--surface-elevated)",
        borderColor: "var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Mobile Menu */}
        <button
          onClick={onMenu}
          className="lg:hidden w-10 h-10 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center hover:bg-[var(--brand-light)] transition"
        >
          <Menu size={20} />
        </button>

        {/* Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand1)] to-[var(--accent)] flex items-center justify-center shadow-lg">
            <Sparkles size={20} className="text-white" />
            <motion.div
              className="absolute inset-0 rounded-xl bg-gradient-to-br from-[var(--brand1)] to-[var(--accent)] blur-md opacity-20"
              animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.05, 1] }}
              transition={{ duration: 2.4, repeat: Infinity }}
            />
          </div>
          <div className="hidden sm:block leading-tight">
            <h1 className="text-lg font-bold text-gradient">SmartDoc</h1>
            <p
              className="text-[11px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Enterprise Suite
            </p>
          </div>
        </div>

        {/* Search */}
        <motion.div
          animate={{
            width: searchActive ? "14rem" : "10rem",
            backgroundColor: "var(--surface)",
          }}
          transition={{ duration: 0.3 }}
          className="hidden md:flex items-center gap-2 border px-3 py-1.5 rounded-xl shadow-sm"
          style={{ borderColor: "var(--border)" }}
          onClick={() => setSearchActive(true)}
        >
          <Search size={16} style={{ color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search..."
            onBlur={() => setSearchActive(false)}
            className="bg-transparent outline-none text-sm w-full"
            style={{ color: "var(--text)" }}
          />
        </motion.div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button className="hidden sm:flex w-10 h-10 rounded-xl bg-[var(--surface-muted)] items-center justify-center hover:bg-[var(--brand-light)] transition">
            <Bell size={18} />
          </button>

          <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center hover:bg-[var(--brand-light)] transition"
            title="Toggle Theme"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={dark ? "dark" : "light"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {dark ? (
                  <Sun size={18} className="text-amber-400" />
                ) : (
                  <Moon size={18} style={{ color: "var(--text-secondary)" }} />
                )}
              </motion.div>
            </AnimatePresence>
          </button>

          <button
            onClick={() => navigate(isAuthenticated ? "/settings" : "/login")}
            className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-2 rounded-xl bg-[var(--surface-muted)] hover:bg-[var(--brand-light)] transition"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--brand1)] to-[var(--accent)] text-white font-semibold flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden lg:block text-left">
              <div
                className="text-sm font-medium flex items-center gap-1.5"
                style={{ color: "var(--text)" }}
              >
                {firstName.split(" ")[0]}
                {user?.plan === "Pro" && (
                  <Crown size={12} className="text-amber-500" />
                )}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--text-tertiary)" }}
              >
                {user?.plan || "Free"}
              </div>
            </div>
            <ChevronDown size={15} style={{ color: "var(--text-tertiary)" }} />
          </button>

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="flex w-10 h-10 rounded-xl bg-[var(--surface-muted)] items-center justify-center hover:bg-[var(--brand-light)] transition sm:hidden"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex w-10 h-10 rounded-xl bg-[var(--surface-muted)] items-center justify-center hover:bg-[var(--brand-light)] transition sm:hidden"
            >
              <LogIn size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Glow underline */}
      <motion.div
        className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--brand1)]/60 to-transparent"
        animate={{ opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.header>
  );
}
