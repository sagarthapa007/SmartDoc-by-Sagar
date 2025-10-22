// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("smartdoc:dark");
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    const html = document.documentElement;

    // Apply or remove the dark class on <html>
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // Save preference
    localStorage.setItem("smartdoc:dark", JSON.stringify(dark));
  }, [dark]);

  const toggle = () => setDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
