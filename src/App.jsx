import React from "react";
import Header from "@components/layout/Header.jsx";
import Container from "@components/layout/Container.jsx";

import UIProvider from "@context/UIContext.jsx";
import { SessionProvider } from "@context/SessionContext.jsx";
import { ExportProvider } from "@context/ExportContext.jsx";
import { ReportProvider } from "@context/ReportContext.jsx";
import { HistoryProvider } from "@context/HistoryContext.jsx";

/**
 * ⚙️ Root SmartDoc App (Global Provider Wrapper)
 * -------------------------------------------------
 * - Wraps the entire app with unified global state contexts
 * - Controls UI theme (dark/light) via UIProvider
 * - Delegates routing to Container.jsx (which now includes Home, Upload, etc.)
 * -------------------------------------------------
 */
export default function App() {
  return (
    <SessionProvider>
      <ExportProvider>
        <ReportProvider>
          <HistoryProvider>
            <UIProvider>
              <MainApp />
            </UIProvider>
          </HistoryProvider>
        </ReportProvider>
      </ExportProvider>
    </SessionProvider>
  );
}

/**
 * 🎯 MainApp: Renders the app header and main router container
 * ------------------------------------------------------------
 * Uses React Router (Container.jsx) for all route-based navigation.
 * Header stays persistent, ensuring consistent UI across all pages.
 */
function MainApp() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
      {/* 🔹 Global Header */}
      <Header />

      {/* 🔹 Dynamic Route Container (uses React Router) */}
      <main className="flex-1 overflow-hidden">
        <Container />
      </main>
    </div>
  );
}
