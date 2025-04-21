"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import localForage from "localforage";
import { useRouter } from "next/navigation";

interface ResponseData {
  name: string;
  schedule: TimeSchedule[][];
  courses: Course[];
}

interface AuthContextType {
  data: ResponseData | null;
  loading: boolean;
  error: string | null;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; data?: ResponseData; error?: string }>;
  logout: () => Promise<void>;
  credentials: {
    username: string | null;
    password: string | null;
  };
}

// Create the auth context with proper typing
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    username: string | null;
    password: string | null;
  }>({
    username: null,
    password: null,
  });
  const router = useRouter();

  // Check for existing session and credentials on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await localForage.getItem<ResponseData | null>(
          "userData"
        );
        const storedUsername = localStorage.getItem("aiubUsername");
        const storedPassword = localStorage.getItem("aiubPassword");

        if (userData) {
          setData(userData);
        }

        if (storedUsername && storedPassword) {
          setCredentials({
            username: storedUsername,
            password: storedPassword,
          });
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post<ResponseData>("/api/aiub-scraper", {
        username,
        password,
      });

      if (response.data) {
        // Check if the schedule array is valid
        if (!response.data.schedule || response.data.schedule.length === 0) {
          throw new Error("Invalid User ID or Password");
        }

        setData(response.data);
        await localForage.setItem("userData", response.data);
        await localForage.setItem("isAuthenticated", "true");

        // Store credentials in localStorage and state
        localStorage.setItem("aiubUsername", username);
        localStorage.setItem("aiubPassword", password);
        setCredentials({ username, password });

        // Redirect after successful login
        router.replace("/aiub");

        return { success: true, data: response.data };
      }

      throw new Error("No data received");
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : err instanceof Error
          ? err.message
          : "Login failed. Please check your credentials.";

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setData(null);
    setCredentials({ username: null, password: null });
    await localForage.setItem("isAuthenticated", "false");
    await localForage.removeItem("aiubUser");
    await localForage.removeItem("userData");

    // Clear stored credentials
    localStorage.removeItem("aiubUsername");
    localStorage.removeItem("aiubPassword");

    // Redirect to login page after logout
    router.replace("/");
  };

  const value = {
    data,
    loading,
    error,
    login,
    logout,
    credentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
