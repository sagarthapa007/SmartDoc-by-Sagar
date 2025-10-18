import React, { createContext, useContext, useMemo, useState } from "react";

// ✅ Unified Session Context (Dataset + Route + Future Expansion)
const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState({
    dataset: null,  // uploaded dataset
    doc: null,      // parsed document
    files: [],      // multi-upload future use
    filters: [],    // active filters
    meta: null,     // file info
  });

  // 🧭 Manage active route ("upload" | "analyze" | "reports" etc.)
  const [route, setRoute] = useState("upload");

  const value = useMemo(
    () => ({
      session,
      setSession,
      route,
      setRoute,
    }),
    [session, route]
  );

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) {
    console.warn("⚠️ useSession called outside provider");
    return { session: {}, setSession: () => {}, route: "upload", setRoute: () => {} };
  }
  return ctx;
}
