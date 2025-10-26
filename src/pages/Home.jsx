import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { Upload, BarChart3, Brain, LogIn, LogOut } from "lucide-react";

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center text-center py-20 px-6"
    >
      {/* Brand Title */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4"
      >
        Welcome to SmartDoc
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-10"
      >
        Your unified workspace for <strong>data intelligence</strong>, 
        <strong> document automation</strong>, and <strong>AI analytics</strong>.  
        Upload, explore, and visualize your insights — all in one click.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-4"
      >
        <button
          onClick={() => navigate("/upload")}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition-all"
        >
          <Upload size={18} /> Upload Files
        </button>

        <button
          onClick={() => navigate("/analyze")}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-cyan-400 font-semibold rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-gray-800 transition-all"
        >
          <BarChart3 size={18} /> Analyze Data
        </button>

        <button
          onClick={() => navigate("/reports")}
          className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-cyan-400 font-semibold rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-gray-800 transition-all"
        >
          <Brain size={18} /> Generate Insights
        </button>
      </motion.div>

      {/* Auth section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10"
      >
        {isAuthenticated ? (
          <>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Logged in as <strong>{user?.email}</strong>
            </p>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:opacity-90 transition-all"
            >
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-all"
          >
            <LogIn size={18} /> Login / Register
          </button>
        )}
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-20 text-sm text-gray-400"
      >
        © {new Date().getFullYear()} SmartDoc : Inspired by Kiran Paudel, Developed by Sagar
      </motion.footer>
    </motion.div>
  );
}
