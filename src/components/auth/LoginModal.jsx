import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";

export default function LoginModal() {
  const { loginOpen, setLoginOpen, login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isRegister) {
        await register(email, password, "user");
        setIsRegister(false);
      } else {
        await login(email, password);
        setLoginOpen(false);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {loginOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-semibold">
                {isRegister ? "Create Account" : "Sign In"}
              </h2>
              <button
                onClick={() => setLoginOpen(false)}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded-xl bg-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition"
              >
                {loading
                  ? "Please wait..."
                  : isRegister
                    ? "Sign Up"
                    : "Sign In"}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                {isRegister ? (
                  <>
                    Already have an account?{" "}
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setIsRegister(false)}
                    >
                      Sign in
                    </span>
                  </>
                ) : (
                  <>
                    Don’t have an account?{" "}
                    <span
                      className="text-blue-600 hover:underline cursor-pointer"
                      onClick={() => setIsRegister(true)}
                    >
                      Create one
                    </span>
                  </>
                )}
              </p>

              <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
                <span
                  className="cursor-pointer text-blue-500 hover:underline"
                  onClick={() => setLoginOpen(false)}
                >
                  Continue without login
                </span>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
