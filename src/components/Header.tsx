"use client";

import React, { useState } from "react";
import { LogOut, RefreshCcw, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Swal from "sweetalert2";
import Link from "next/link";

const Header = () => {
  const { logout, data, login, credentials, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const name = data?.name;

  const storedUsername = localStorage.getItem("aiubUsername");
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;

    // First check if we have credentials
    if (!credentials.username || !credentials.password) {
      console.error("Missing credentials for refresh");
      Swal.fire({
        title: "Error!",
        text: "Cannot refresh data: Missing credentials",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#003366",
      });
      return;
    }

    // Start loading state and show indicator
    setIsRefreshing(true);
    setRefreshSuccess(false);

    // Show a loading notification
    Swal.fire({
      title: "Refreshing...",
      text: "Please wait while we fetch your latest data",
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      // console.log("Attempting refresh with:", credentials.username);
      const result = await login(credentials.username, credentials.password);

      // Close the loading dialog
      Swal.close();

      if (result.success) {
        // Show success notification
        Swal.fire({
          title: "Success!",
          text: "Your data has been refreshed successfully",
          icon: "success",
          confirmButtonText: "Great!",
          confirmButtonColor: "#003366",
          timer: 3000,
          timerProgressBar: true,
        });

        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 2000);
      } else {
        throw new Error("Unknown error occurred");
      }
    } catch (error) {
      console.error("Data refresh failed:", error);

      // Close loading dialog and show error
      Swal.fire({
        title: "Error!",
        text:
          error instanceof Error
            ? error.message
            : "Failed to refresh data. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#003366",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const adminUsername = process.env.NEXT_PUBLIC_ADMIN;

  return (
    <header className=" sticky lg:px-44 top-0 left-0 z-10 flex flex-col sm:flex-row justify-between items-center bg-white shadow-md pr-2  gap-3">
      <div className="flex items-center w-full justify-between">
        <div className="flex items-center gap-3">
          <Link href="/aiub" className=" relative">
            <img
              src="/logo.png"
              alt="AIUB Logo"
              className="h-16 w-auto object-fill cursor-pointer"
            />
            <strong className=" absolute bottom-0 right-0 text-blue-700 text-[10px]">(Beta 1.1.0)</strong>
          </Link>
          <span className="text-[#003366] text-sm lg:text-[16px] font-medium">
            Hi,{" "}
            <span className="font-bold">
              {storedUsername == adminUsername ? "Admin" : name}
              <span className="text-[10px]">({storedUsername})</span>
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="ml-2 text-[#003366] hover:text-[#002244] transition-all relative"
              title="Refresh data"
            >
              {refreshSuccess ? (
                <CheckCircle2
                  size={16}
                  className="inline text-green-600 animate-pulse"
                />
              ) : (
                <RefreshCcw
                  size={16}
                  className={`inline ${
                    isRefreshing
                      ? "animate-spin text-blue-600"
                      : "hover:rotate-180 transition-transform duration-500"
                  }`}
                />
              )}
              {isRefreshing && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-ping"></span>
              )}
            </button>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="bg-[#003366] text-white flex items-center gap-2 px-4 py-2 rounded-md hover:bg-[#002244] transition duration-300 text-sm lg:text-base"
          >
            <LogOut size={18} /> <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
