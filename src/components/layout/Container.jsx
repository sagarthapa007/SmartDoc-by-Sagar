import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Upload from "@pages/Upload.jsx";
import Analyze from "@pages/Analyze.jsx";
import Compare from "@pages/Compare.jsx";
import Reports from "@pages/Reports.jsx";
import History from "@pages/History.jsx";
import { useSession } from "@context/SessionContext.jsx";

/**
 * 🧭 SmartDoc Navigation Container
 * Handles routing and ensures consistent layout + context awareness.
 * Provides graceful loading states and future-proof route structure.
 */
export default function Container() {
  const { session } = useSession();

  return (
    <main 
      className="section min-h-[calc(100vh-96px)] overflow-hidden bg-[var(--background)] text-[var(--text)] transition-all duration-300 animate-fadein"
      role="main"
      aria-label="SmartDoc Enterprise main content"
    >
      <Routes>
        {/* Default redirect with explicit intent */}
        <Route 
          path="/" 
          element={<Navigate to="/upload" replace />} 
        />

        {/* Core application pages */}
        <Route path="/upload" element={<Upload />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/history" element={<History />} />

        {/* Future feature routes - development preview */}
        <Route
          path="/insights"
          element={
            <Placeholder
              title="Intelligent Insights"
              description="Predictive analytics and pattern recognition tools coming soon."
              icon="🔮"
              expectedRelease="Q2 2024"
            />
          }
        />
        <Route
          path="/automation"
          element={
            <Placeholder
              title="Workflow Automation"
              description="Automated data processing and scheduled reporting under development."
              icon="⚙️"
              expectedRelease="Q3 2024"
            />
          }
        />
        <Route
          path="/admin"
          element={
            <Placeholder
              title="Administration Console"
              description="User management, access controls, and system configuration coming soon."
              icon="🛡️"
              expectedRelease="Q4 2024"
            />
          }
        />

        {/* Global fallback for undefined routes */}
        <Route
          path="*"
          element={
            <Placeholder
              title="Page Not Found"
              description="The page you're looking for doesn't exist. Check the URL or navigate using the menu."
              icon="🧭"
              isError={true}
            />
          }
        />
      </Routes>
    </main>
  );
}

/** 
 * 🔹 Reusable placeholder for upcoming features and error states
 * Enhanced with better accessibility and user guidance
 */
function Placeholder({ title, description, icon = "🚧", expectedRelease, isError = false }) {
  return (
    <div 
      className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4 fade-in animate-fade-in"
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      <div className={`card text-center max-w-md mx-auto shadow-lg border transition-all duration-300 hover:shadow-xl ${
        isError 
          ? "border-[var(--error)]/20 bg-[var(--error)]/5" 
          : "border-[var(--border)] bg-[var(--card)]"
      }`}>
        {/* Visual indicator */}
        <div className={`text-4xl mb-4 transition-transform duration-300 hover:scale-110 ${
          isError ? "text-[var(--error)]" : "text-[var(--brand1)]"
        }`}>
          {icon}
        </div>
        
        {/* Content */}
        <h2 className={`text-xl font-semibold mb-3 ${
          isError ? "text-[var(--error)]" : "text-gradient"
        }`}>
          {title}
        </h2>
        
        <p className="text-sm opacity-80 leading-relaxed mb-4">
          {description}
        </p>

        {/* Additional context for future features */}
        {expectedRelease && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand1)]/10 border border-[var(--brand1)]/20 text-xs text-[var(--brand1)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand1)] animate-pulse"></span>
            Expected: {expectedRelease}
          </div>
        )}

        {/* Action guidance for 404 pages */}
        {isError && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
            <p className="text-xs opacity-70">
              Return to <a href="/upload" className="text-[var(--brand1)] hover:underline">Upload</a> or use the navigation menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}