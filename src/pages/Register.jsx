// src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.jsx";
import { motion } from "framer-motion";

export default function Register() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      await register(email, password, fullName, organization, country);
      setSuccess("✅ Account created successfully! Please verify your email.");
      setTimeout(() => navigate("/login"), 4000);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800"
      >
        <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-6">
          Create Your SmartDoc Account
        </h1>

        {error && <div className="text-red-500 text-sm mb-4 text-center">{error}</div>}
        {success && <div className="text-green-500 text-sm mb-4 text-center">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            placeholder="Organization / Company"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Country</option>
            <option value="Nepal">Nepal</option>
            <option value="India">India</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Singapore">Singapore</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
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

          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm Password"
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-6">
          Already have an account?{" "}
          <span
            className="text-blue-600 dark:text-cyan-400 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Sign in here
          </span>
        </p>
      </motion.div>
    </div>
  );
}
