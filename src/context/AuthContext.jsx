import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("smartdoc_token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("smartdoc_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (t, u) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("smartdoc_token", t);
    localStorage.setItem("smartdoc_user", JSON.stringify(u || {}));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("smartdoc_token");
    localStorage.removeItem("smartdoc_user");
  };

  const value = useMemo(() => ({
    token, user, isAuthenticated: Boolean(token), login, logout
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);