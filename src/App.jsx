import React from "react";
import Header from "@components/layout/Header.jsx";
import Container from "@components/layout/Container.jsx";

import UIProvider from "@context/UIContext.jsx";
import { SessionProvider, useSession } from "@context/SessionContext.jsx";
import { ExportProvider } from "@context/ExportContext.jsx";
import { ReportProvider } from "@context/ReportContext.jsx";
import { HistoryProvider } from "@context/HistoryContext.jsx";

// === Pages ===
import Upload from "@pages/Upload.jsx";
import Analyze from "@pages/Analyze.jsx";

/**
 * ⚙️ Root SmartDoc App (Multi-Provider Wrapper)
 * -------------------------------------------------
 * - Provides unified state across modules (Session, Export, Report, etc.)
 * - Maintains Dark/Light mode via UIContext
 * - Handles page routing dynamically via SessionContext (route, setRoute)
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
 * 🎯 MainApp: Renders header + page routing
 * Uses `route` from SessionContext to switch views dynamically.
 */
function MainApp() {
  const { route } = useSession();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text)] flex flex-col">
      {/* 🔹 Global Header */}
      <Header />

      {/* 🔹 Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {route === "upload" && <Upload />}
        {route === "analyze" && <Analyze />}
        {route !== "upload" && route !== "analyze" && <Container />}
      </main>
    </div>
  );
}
