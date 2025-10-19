import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useTheme from "@hooks/useTheme.js";
import {
  Home,
  Search,
  Settings,
  Moon,
  Sun,
  Database,
  BarChart3,
  FileSpreadsheet,
  Layers,
  Activity,
  Shield,
  Menu,
  X,
} from "lucide-react";

export default function Header() {
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState("");
  const path = location.pathname;

  const menu = useMemo(
    () => [
      { label: "Home", path: "/", icon: <Home size={16} /> },
      { label: "Upload", path: "/upload", icon: <Database size={16} /> },
      { label: "Analyze", path: "/analyze", icon: <BarChart3 size={16} /> },
      { label: "Compare", path: "/compare", icon: <Layers size={16} /> },
      { label: "Reports", path: "/reports", icon: <FileSpreadsheet size={16} /> },
      { label: "History", path: "/history", icon: <Activity size={16} /> },
      { label: "Insights", path: "/insights", icon: <BarChart3 size={16} /> },
      { label: "Automation", path: "/automation", icon: <Layers size={16} /> },
      { label: "Admin", path: "/admin", icon: <Shield size={16} /> },
    ],
    []
  );

  const activeStyles =
    "bg-[var(--brand1)]/15 text-[var(--brand1)] border border-[var(--brand1)]/30 shadow-sm";
  const inactiveStyles =
    "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--muted)]";

  function onSearch(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    localStorage.setItem("smartdoc_search", query);
    navigate("/analyze");
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur-lg border-b border-[var(--border)] shadow-sm supports-[backdrop-filter]:bg-[var(--background)]/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-nowrap">
        <div className="flex items-center gap-2 font-semibold tracking-tight flex-shrink-0 min-w-[190px]">
          <img src="/logo.svg" className="w-6 h-6" alt="SmartDoc Enterprise Logo" />
          <Link
            to="/"
            className="hover:opacity-80 transition text-[var(--brand1)] flex items-baseline gap-1 focus:outline-none focus:ring-2 focus:ring-[var(--brand1)] focus:ring-offset-2 rounded"
            aria-label="SmartDoc Enterprise Home"
          >
            SMARTDOC
            <span className="text-[11px] text-[var(--text-secondary)] opacity-70 text-nowrap hidden sm:inline ml-1">
              Enterprise Suite
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center relative z-10" aria-label="Main navigation">
          {menu.map((item) => {
            const isActive = path === item.path || (item.path !== "/" && path.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand1)] focus:ring-offset-2 ${isActive ? activeStyles : inactiveStyles}`}
                aria-current={isActive ? "page" : undefined}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          <form onSubmit={onSearch} className="flex items-center gap-2 border border-[var(--border)] rounded-lg px-2 py-1.5 bg-[var(--surface)] focus-within:ring-1 focus-within:ring-[var(--brand1)] focus-within:border-[var(--brand1)] transition-all duration-200" role="search">
            <Search size={16} className="opacity-70 flex-shrink-0" aria-hidden="true" />
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Search dataset…"
              className="bg-transparent outline-none text-sm w-36 focus:w-48 transition-all duration-200 placeholder-[var(--text-muted)]"
              aria-label="Search datasets"
            />
          </form>

          <button className="kbd hover:scale-105 transition-transform" onClick={()=>alert("Settings coming soon!")}>
            <Settings size={18} aria-hidden="true" />
          </button>
          <button className="kbd hover:scale-105 transition-transform" onClick={toggle} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <button className="md:hidden kbd hover:scale-105 transition-transform" onClick={() => setMobileOpen((v) => !v)} aria-label={mobileOpen ? "Close menu" : "Open menu"} aria-expanded={mobileOpen} aria-controls="mobile-menu">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-md shadow-lg animate-slideDown supports-[backdrop-filter]:bg-[var(--background)]/90" role="dialog" aria-label="Mobile navigation menu">
          <nav className="flex flex-col px-4 py-3 gap-1" aria-label="Mobile navigation">
            {menu.map((item) => {
              const isActive = path === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? activeStyles : inactiveStyles}`} aria-current={isActive ? "page" : undefined}>
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
              <button onClick={()=>alert("Settings coming soon!")} className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity py-1">
                <Settings size={16} aria-hidden="true" />
                Settings
              </button>
              <button onClick={toggle} className="flex items-center gap-2 text-sm opacity-80 hover:opacity-100 transition-opacity py-1">
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </nav>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
      `}</style>
    </header>
  );
}
