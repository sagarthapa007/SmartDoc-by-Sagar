// src/context/LayoutContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LayoutCtx = createContext(null);

export function LayoutProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const value = useMemo(
    () => ({ sidebarOpen, setSidebarOpen, isDesktop }),
    [sidebarOpen, isDesktop],
  );
  return <LayoutCtx.Provider value={value}>{children}</LayoutCtx.Provider>;
}

export function useLayout() {
  const ctx = useContext(LayoutCtx);
  if (!ctx) throw new Error("useLayout must be used within LayoutProvider");
  return ctx;
}
