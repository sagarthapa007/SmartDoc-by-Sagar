import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@context/ThemeContext.jsx";

// Layout
import SmartLayout from "@components/layout/SmartLayout.jsx";

// Lazy-loaded pages (better performance)
const Home = lazy(() => import("@pages/Home.jsx"));
const Upload = lazy(() => import("@pages/Upload.jsx"));
const Analyze = lazy(() => import("@pages/Analyze.jsx"));
const Compare = lazy(() => import("@pages/Compare.jsx"));
const Reports = lazy(() => import("@pages/Reports.jsx"));
const History = lazy(() => import("@pages/History.jsx"));
const Settings = lazy(() => import("@pages/Settings.jsx"));
const FeatureDetail = lazy(() => import("@pages/features/FeatureDetail.jsx"));
const Login = lazy(() => import("@pages/Login.jsx")); // ✅ Added Sign-In route
const Register = lazy(() => import("@/pages/Register.jsx"));

// Providers
import UIProvider from "@context/UIContext.jsx";
import { SessionProvider } from "@context/SessionContext.jsx";
import { ExportProvider } from "@context/ExportContext.jsx";
import { ReportProvider } from "@context/ReportContext.jsx";
import { HistoryProvider } from "@context/HistoryContext.jsx";
import { AuthProvider } from "@context/AuthContext.jsx";

import "@styles/globals.css";
import "@styles/theme.css";
import "@styles/layout.css";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SessionProvider>
          <ExportProvider>
            <ReportProvider>
              <HistoryProvider>
                <UIProvider>
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center h-[calc(100vh-96px)] text-[var(--text-muted)]">
                        Loading SmartDoc...
                      </div>
                    }
                  >
                    <Routes>
                      {/* 🔓 Public route for Login */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />

                      {/* 🔒 All authenticated pages inside layout */}
                      <Route path="/" element={<SmartLayout />}>
                        <Route index element={<Home />} />
                        <Route path="upload" element={<Upload />} />
                        <Route path="analyze" element={<Analyze />} />
                        <Route path="compare" element={<Compare />} />
                        <Route path="reports" element={<Reports />} />
                        <Route path="history" element={<History />} />
                        <Route path="features/:id" element={<FeatureDetail />} />
                        <Route path="settings" element={<Settings />} />
                        <Route
                          path="*"
                          element={<div className="p-6">404 Not Found</div>}
                        />
                      </Route>
                    </Routes>
                  </Suspense>
                </UIProvider>
              </HistoryProvider>
            </ReportProvider>
          </ExportProvider>
        </SessionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
