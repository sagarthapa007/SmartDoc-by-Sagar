import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

// ✅ Import the provider so all child components (like UploaderPanel) get access
import { SessionProvider } from "@context/SessionContext.jsx";

import "@styles/globals.css";
import "@styles/theme.css";
import "@styles/layout.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* ✅ Provide session context at the top level */}
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </React.StrictMode>
);
