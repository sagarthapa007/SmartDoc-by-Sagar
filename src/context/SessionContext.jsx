import React, { createContext, useContext, useState } from "react";

// Create context
const SessionContext = createContext();

/**
 * 🧭 SmartDoc Session Context
 * Stores the active dataset, user state, and session metadata.
 */
export function SessionProvider({ children }) {
  const [session, setSessionState] = useState({
    dataset: null,
    user: null,
    meta: {},
  });

  // Enhanced setSession that handles both object and function updates
  const setSession = (update) => {
    if (typeof update === 'function') {
      setSessionState(prev => {
        const newSession = update(prev);
        console.log('🔄 Session updated (function):', newSession);
        return newSession;
      });
    } else {
      console.log('🔄 Session updated (object):', update);
      setSessionState(update);
    }
  };

  const value = {
    session,
    setSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Custom hook
export function useSession() {
  const context = useContext(SessionContext);
  
  if (!context) {
    //console.error('❌ useSession called outside SessionProvider');
    throw new Error("useSession must be used within a SessionProvider");
  }
  
  //console.log('🎯 useSession returning:', { 
  //  session: context.session, 
  //  hasSetSession: !!context.setSession 
  //});
  
  return context; // ✅ FIX: Uncomment this line!
}

// Default export
export default SessionContext;