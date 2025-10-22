import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { supabase } from "@/utils/supabaseClient.js";
import { motion } from "framer-motion";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const navigate = useNavigate();

  // 🔹 Handle standard login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Handle forgot password flow
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setSuccess("Reset link sent! Please check your email.");
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Already logged in state
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-6 rounded-2xl bg-white dark:bg-gray-900 shadow-xl">
          <h2 className="text-2xl font-semibold mb-2">Welcome Back!</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Logged in as <strong>{user.email}</strong>
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800"
      >
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
          {resetMode ? "Reset Password" : "SmartDoc Login"}
        </h1>

        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        {success && <div className="text-green-500 text-sm mb-4 text-center">{success}</div>}

        {!resetMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="text-right">
              <span
                className="text-sm text-blue-600 dark:text-cyan-400 cursor-pointer hover:underline"
                onClick={() => setResetMode(true)}
              >
                Forgot Password?
              </span>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your registered email"
              className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
            >
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>
            <p
              className="text-sm text-gray-500 dark:text-gray-400 text-center cursor-pointer hover:underline"
              onClick={() => setResetMode(false)}
            >
              Back to Login
            </p>
          </form>
        )}

        {!resetMode && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
              Don’t have an account?{" "}
              <span
                className="text-blue-600 dark:text-cyan-400 cursor-pointer hover:underline"
                onClick={() => navigate("/register")}
              >
                Register here
              </span>
            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              Just exploring?{" "}
              <span
                className="text-blue-600 dark:text-cyan-400 cursor-pointer hover:underline"
                onClick={() => navigate("/")}
              >
                Continue without login
              </span>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
