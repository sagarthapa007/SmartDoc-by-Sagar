import React, { useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "@pages/Home.jsx";
import Upload from "@pages/Upload.jsx";
import Analyze from "@pages/Analyze.jsx";
import Compare from "@pages/Compare.jsx";
import Reports from "@pages/Reports.jsx";
import History from "@pages/History.jsx";
import FeatureDetail from "@pages/features/FeatureDetail.jsx";
import { useSession } from "@context/SessionContext.jsx";

/**
 * 🧭 SmartDoc Navigation Container
 * - Handles all route-based navigation
 * - Keeps placeholder routes dynamic (via useMemo)
 * - Cleanly integrates 404 handling
 */
export default function Container() {
  const { session } = useSession();

  // ✅ React-safe memoized placeholder list
  const placeholderRoutes = useMemo(
    () => [
      {
        path: "/insights",
        title: "Intelligent Insights",
        description:
          "Predictive analytics and pattern recognition tools coming soon.",
        icon: "🔮",
        expectedRelease: "Q2 2025",
      },
      {
        path: "/automation",
        title: "Workflow Automation",
        description:
          "Automated data processing and scheduled reporting under development.",
        icon: "⚙️",
        expectedRelease: "Q3 2025",
      },
      {
        path: "/admin",
        title: "Administration Console",
        description:
          "User management, access controls, and system configuration coming soon.",
        icon: "🛡️",
        expectedRelease: "Q4 2025",
      },
    ],
    []
  );

  return (
    <main
      className="section min-h-[calc(100vh-96px)] overflow-hidden bg-[var(--background)] text-[var(--text)] transition-all duration-300 animate-fadein"
      role="main"
      aria-label="SmartDoc Enterprise main content"
    >
      <Routes>
        {/* 🏠 Default Landing */}
        <Route path="/" element={<Home />} />

        {/* 🔹 Core Routes */}
        <Route path="/features/:id" element={<FeatureDetail />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/history" element={<History />} />

        {/* 🔮 Future Routes (auto-generated from memo) */}
        {placeholderRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              <Placeholder
                title={route.title}
                description={route.description}
                icon={route.icon}
                expectedRelease={route.expectedRelease}
              />
            }
          />
        ))}

        {/* ❌ 404 Fallback */}
        <Route
          path="*"
          element={
            <Placeholder
              title="Page Not Found"
              description="The page you're looking for doesn't exist. Please check the URL or use the main menu."
              icon="🧭"
              isError
            />
          }
        />
      </Routes>
    </main>
  );
}

/**
 * 🪧 Reusable Placeholder Component
 * - Used for 'coming soon' and 404 routes
 * - Consistent styling across SmartDoc
 */
function Placeholder({
  title,
  description,
  icon = "🚧",
  expectedRelease,
  isError = false,
}) {
  return (
    <div
      className="flex items-center justify-center min-h-[calc(100vh-120px)] p-4"
      role={isError ? "alert" : "status"}
      aria-live="polite"
    >
      <div
        className={`card text-center max-w-md mx-auto shadow-lg border transition-all duration-300 hover:shadow-xl ${
          isError
            ? "border-[var(--error)]/20 bg-[var(--error)]/5"
            : "border-[var(--border)] bg-[var(--card)]"
        }`}
      >
        <div
          className={`text-4xl mb-4 transition-transform duration-300 hover:scale-110 ${
            isError ? "text-[var(--error)]" : "text-[var(--brand1)]"
          }`}
        >
          {icon}
        </div>

        <h2
          className={`text-xl font-semibold mb-3 ${
            isError ? "text-[var(--error)]" : "text-gradient"
          }`}
        >
          {title}
        </h2>

        <p className="text-sm opacity-80 leading-relaxed mb-4">{description}</p>

        {expectedRelease && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--brand1)]/10 border border-[var(--brand1)]/20 text-xs text-[var(--brand1)] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand1)] animate-pulse"></span>
            Expected: {expectedRelease}
          </div>
        )}

        {isError && (
          <div className="mt-4 pt-3 border-t border-[var(--border)]/50">
            <p className="text-xs opacity-70">
              Return to{" "}
              <a href="/upload" className="text-[var(--brand1)] hover:underline">
                Upload
              </a>{" "}
              or use the main navigation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
