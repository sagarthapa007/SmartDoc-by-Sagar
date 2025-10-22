import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SmartTopbar from "@/components/layout/SmartTopbar.jsx";
import SmartSidebar from "@/components/layout/SmartSidebar.jsx";

const LS_PIN_KEY = "smartdoc:sidebar:pinned";
const LS_SIDE_KEY = "smartdoc:sidebar:side";

export default function SmartLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pinned, setPinned] = useState(() => {
    const v = localStorage.getItem(LS_PIN_KEY);
    return v ? JSON.parse(v) : true;
  });
  const [side, setSide] = useState(() => localStorage.getItem(LS_SIDE_KEY) || "left");

  useEffect(() => {
    localStorage.setItem(LS_PIN_KEY, JSON.stringify(pinned));
  }, [pinned]);
  useEffect(() => {
    localStorage.setItem(LS_SIDE_KEY, side);
  }, [side]);

  return (
    <div className="min-h-screen flex flex-col">
      <SmartTopbar onMenu={() => setMobileOpen(true)} />

      <div className={`flex-1 grid ${side === "left" ? "grid-cols-[auto,1fr]" : "grid-cols-[1fr,auto]"} gap-0`}>
        {/* Desktop sidebar */}
        {side === "left" && (
          <div className="hidden lg:block">
            <SmartSidebar
              side={side}
              pinned={pinned}
              onTogglePin={() => setPinned(v => !v)}
              onSwitchSide={() => setSide(s => (s === "left" ? "right" : "left"))}
            />
          </div>
        )}

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <Outlet />
          </div>
        </main>

        {side === "right" && (
          <div className="hidden lg:block">
            <SmartSidebar
              side={side}
              pinned={pinned}
              onTogglePin={() => setPinned(v => !v)}
              onSwitchSide={() => setSide(s => (s === "left" ? "right" : "left"))}
            />
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className={`fixed top-0 ${side === "left" ? "left-0" : "right-0"} z-[80] h-full w-[82vw] max-w-[300px] lg:hidden`}
              initial={{ x: side === "left" ? -320 : 320, opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: side === "left" ? -320 : 320, opacity: 0.8 }}
              transition={{ type: "spring", damping: 24 }}
            >
              <SmartSidebar
                side={side}
                pinned={true}
                onTogglePin={() => {}}
                onSwitchSide={() => setSide(s => (s === "left" ? "right" : "left"))}
                onNavigate={() => setMobileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
