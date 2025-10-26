import React, { createContext, useContext, useState, useEffect } from "react";
import useAnalyzeStore from "@/components/analyzer/analyze.store.js";


const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSessionState] = useState({
    dataset: null,
    analysis: null,
    user: null,
    meta: {},
  });

  const { dataset, analysis } = useAnalyzeStore();

  // ✅ Automatically mirror Zustand → Context
  useEffect(() => {
    if (dataset) {
      setSessionState((prev) => ({
        ...prev,
        dataset,
      }));
    }
  }, [dataset]);

  useEffect(() => {
    if (analysis) {
      setSessionState((prev) => ({
        ...prev,
        analysis,
      }));
    }
  }, [analysis]);

  const setSession = (update) => {
    if (typeof update === "function") {
      setSessionState((prev) => {
        const newSession = update(prev);
        console.log("🔄 Session updated (function):", newSession);
        return { ...prev, ...newSession };
      });
    } else {
      console.log("🔄 Session updated (object):", update);
      setSessionState((prev) => ({ ...prev, ...update }));
    }
  };

  useEffect(() => {
    console.log("🧠 Current Session:", session);
  }, [session]);

  const value = { session, setSession };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used within a SessionProvider");
  return context;
}

export default SessionContext;
