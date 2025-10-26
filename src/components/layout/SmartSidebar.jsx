import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  FolderOpen,
  Wand2,
  Sparkles,
  Users,
  Settings,
  Pin,
  PinOff,
  PanelLeftClose,
  PanelRightClose,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/layout.config.js";
import { useTheme } from "@/context/ThemeContext.jsx";

const ICON_MAP = { Home, FolderOpen, Wand2, Sparkles, Users, Settings };

export default function SmartSidebar({
  side = "left",
  pinned = true,
  onTogglePin,
  onSwitchSide,
  onNavigate,
}) {
  const [hovered, setHovered] = useState(null);
  const { dark } = useTheme();

  const sizes = { collapsed: 72, expanded: 264 };
  const variants = useMemo(
    () => ({
      collapsed: { width: sizes.collapsed },
      expanded: { width: sizes.expanded },
    }),
    [],
  );

  const SideSwitchIcon = side === "left" ? PanelRightClose : PanelLeftClose;

  return (
    <motion.aside
      variants={variants}
      animate={pinned ? "expanded" : "collapsed"}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={`
        relative h-full flex flex-col transition-all duration-300
        backdrop-blur-xl border rounded-2xl shadow-[var(--shadow-md)]
        ${side === "left" ? "border-r" : "border-l"}
        ${dark ? "bg-[var(--surface-elevated)/80]" : "bg-[var(--surface)/80]"}
        mx-3 my-3 overflow-hidden
      `}
      style={{
        borderColor: "var(--border)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      {/* ===== Top Controls ===== */}
      <div
        className="flex items-center justify-between px-3 py-4 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={onTogglePin}
          className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition"
          title={pinned ? "Unpin sidebar" : "Pin sidebar"}
        >
          {pinned ? <Pin size={16} /> : <PinOff size={16} />}
        </button>

        <AnimatePresence>
          {pinned && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="hidden lg:flex items-center gap-2 font-bold text-gradient"
            >
              <Zap size={14} className="text-[var(--brand)]" />
              SmartDoc
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={onSwitchSide}
          className="p-2 rounded-lg hover:bg-[var(--surface-muted)] transition"
          title={`Dock to ${side === "left" ? "right" : "left"}`}
        >
          <SideSwitchIcon size={16} />
        </button>
      </div>

      {/* ===== Navigation ===== */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = ICON_MAP[item.icon] || Home;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <NavLink
                to={item.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl transition-all duration-200 px-3 py-2.5 w-full
                   ${
                     isActive
                       ? "bg-[var(--brand-light)] text-[var(--brand)] shadow-[var(--shadow-sm)] border border-[var(--border-hover)]"
                       : "text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-muted)]"
                   }`
                }
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                title={!pinned ? item.label : undefined}
              >
                <motion.div
                  className="relative flex-shrink-0"
                  whileHover={{ scale: 1.06, rotate: 3 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Icon size={19} />
                  <motion.div
                    className="absolute inset-0 bg-[var(--brand-light)] blur-md rounded-full"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: hovered === item.id ? 1 : 0,
                      scale: hovered === item.id ? 1 : 0.6,
                    }}
                    transition={{ duration: 0.18 }}
                  />
                </motion.div>

                <AnimatePresence>
                  {pinned && (
                    <motion.span
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="text-sm font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* ===== Footer Hint ===== */}
      <div
        className="px-3 py-3 text-xs"
        style={{
          borderTop: "1px solid var(--border)",
          color: "var(--text-tertiary)",
        }}
      >
        {pinned ? "Click pin to collapse" : "Hover for labels"}
      </div>

      {/* Floating glow edge */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--brand-light)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
      </div>
    </motion.aside>
  );
}
