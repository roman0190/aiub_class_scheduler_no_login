"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUser,
  FaInfoCircle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Link from "next/link";
import localForage from "localforage";

export default function Login() {
  const { login, loading } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);

  useEffect(() => {
    const checkFirstVisit = async () => {
      const hasVisited = await localForage.getItem("hasVisited");
      if (!hasVisited) {
        setShowAbout(true);
        setFirstVisit(true);
        await localForage.setItem("hasVisited", true);
      } else {
        setShowAbout(false);
        setFirstVisit(false);
      }
    };
    checkFirstVisit();
  }, []);

  useEffect(() => {
    if (firstVisit) {
      const timer = setTimeout(() => {
        setShowAbout(false);
        setFirstVisit(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [firstVisit]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!acceptTerms) {
      setError("You must accept the Terms and Policy to continue");
      return;
    }

    setError("");
    try {
      const res = await login(userId, password);
      if (!res.success) {
        setError(res.error || "Invalid User ID or Password");
        await localForage.setItem("isAuthenticated", "false");
        return;
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to login. Please try again.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleAbout = () => {
    setShowAbout(!showAbout);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-xl border border-blue-50"
      >
        <motion.div
          className="text-center"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-center mb-[-2rem]">
            <img
              src="/logo.png"
              alt="AIUB Logo"
              className="h-40 w-auto drop-shadow-md transition-all hover:scale-105"
            />
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-500 text-center font-medium bg-red-50 py-3 px-4 rounded-lg border-l-4 border-red-500"
          >
            {error}
          </motion.div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaUser className="text-gray-400" />
            </div>
            <input
              id="userid"
              name="userid"
              type="text"
              onChange={(e) => setUserId(e.target.value)}
              value={userId}
              required
              autoComplete="username"
              className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 text-[#003366] transition-all"
              placeholder="User ID eg. XX-XXXXX-X"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <FaLock className="text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              required
              autoComplete="current-password"
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 text-[#003366] transition-all"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            >
              {showPassword ? (
                <FaEyeSlash className="text-lg" />
              ) : (
                <FaEye className="text-lg" />
              )}
            </button>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
              />
            </div>
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
              I accept the{" "}
              <Link
                href="/terms"
                className="text-blue-600 hover:underline hover:text-blue-800"
              >
                Terms and Policy
              </Link>
            </label>
          </div>

          <div>
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-blue-700 to-[#003366] hover:from-blue-800 hover:to-[#002244] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed shadow-md transition-all"
            >
              {loading ? "Logging in..." : "Login"}
            </motion.button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <a
              href="#"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Forgot Password?
            </a>
            <motion.button
              type="button"
              onClick={toggleAbout}
              className="text-sm flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              whileHover={{ scale: 1.05 }}
              animate={
                firstVisit
                  ? {
                      scale: [1, 1.1, 1],
                      transition: {
                        repeat: 3,
                        repeatType: "reverse",
                        duration: 1,
                      },
                    }
                  : {}
              }
            >
              <FaInfoCircle className={firstVisit ? "text-blue-700" : ""} />
              About
            </motion.button>
          </div>
        </form>

        {/* Updated About Section */}
        {showAbout && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-blue-50 rounded-lg p-4 text-sm border-l-4 border-blue-500"
          >
            <motion.h3
              className="font-medium text-blue-700 mb-2"
              animate={{ color: ["#1d4ed8", "#3b82f6", "#1d4ed8"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              AIUB Class Scheduler(AIUB CS)
            </motion.h3>

            <p className="text-gray-700 mb-2">
              Tired of manually creating your class routine every semester? Say
              goodbye to the hassle, this tool automatically generates your
              class schedule for you.
            </p>

            <p className="text-gray-700 mb-2">
              Log in with your AIUB credentials, pick your preferred courses,
              hit ‘Generate’ — and boom! Your perfect routine is ready without
              any clash or hassle.
            </p>

            <p className="text-gray-700 mb-2">What it offers:</p>
            <ul className="list-disc pl-5 text-gray-700 mb-2">
              <li>Select your preferred open credit courses</li>
              <li>
                Generate an optimized, clash-free class routine in seconds
              </li>
              <li>
                Automatically skips canceled, reserved, or freshman-only courses
              </li>
              <li>
                Prioritizes your course preferences and available time slots
              </li>
            </ul>

            <motion.p
              className="text-gray-700 text-xs mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              Built with 💙 by{" "}
              <a
                className="text-blue-500 font-semibold hover:underline"
                href="https://roman0190.github.io/portfolio/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Roman Howladar
              </a>{" "}
              — crafted exclusively for AIUB students to eliminate the hassle of
              manual routine making. Focus on what matters — learning, not
              scheduling.
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
