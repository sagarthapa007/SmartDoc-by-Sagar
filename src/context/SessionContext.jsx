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
      // ✅ ADD THIS CHECK - ensure dataset is not a function
      if (typeof dataset === 'function') {
        console.warn('⚠️ Dataset is a function, skipping sync to session');
        return;
      }
      setSessionState((prev) => ({
        ...prev,
        dataset,
      }));
    }
  }, [dataset]);

  useEffect(() => {
    if (analysis) {
      // ✅ ADD THIS CHECK - ensure analysis is not a function
      if (typeof analysis === 'function') {
        console.warn('⚠️ Analysis is a function, skipping sync to session');
        return;
      }
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
        
        // ✅ ADD THIS CHECK - ensure dataset/analysis are not functions
        const sanitizedSession = { ...newSession };
        if (typeof sanitizedSession.dataset === 'function') {
          console.warn('⚠️ Preventing function from being set as dataset');
          sanitizedSession.dataset = null;
        }
        if (typeof sanitizedSession.analysis === 'function') {
          console.warn('⚠️ Preventing function from being set as analysis');
          sanitizedSession.analysis = null;
        }
        
        return { ...prev, ...sanitizedSession };
      });
    } else {
      console.log("🔄 Session updated (object):", update);
      
      // ✅ ADD THIS CHECK for object updates too
      const sanitizedUpdate = { ...update };
      if (typeof sanitizedUpdate.dataset === 'function') {
        console.warn('⚠️ Preventing function from being set as dataset');
        sanitizedUpdate.dataset = null;
      }
      if (typeof sanitizedUpdate.analysis === 'function') {
        console.warn('⚠️ Preventing function from being set as analysis');
        sanitizedUpdate.analysis = null;
      }
      
      setSessionState((prev) => ({ ...prev, ...sanitizedUpdate }));
    }
  };

  useEffect(() => {
    console.log("🧠 Current Session:", session);
  }, [session]);

  const value = { session, setSession };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context)
    throw new Error("useSession must be used within a SessionProvider");
  return context;
}

export default SessionContext;