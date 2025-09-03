"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Autocomplete from "@/components/Autocomplete";
import Link from "next/link";
import Swal from "sweetalert2";

const Home = () => {
  // State for file upload
  const [fileUploaded, setFileUploaded] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (loading) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 300);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle file upload
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post("/api/parseExcel", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setCourses(data.data);
      setProgress(100);
      setFileUploaded(true);
      Swal.fire({
        icon: "success",
        title: "File Processed",
        text: "The file has been successfully processed!",
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to process file");
      } else {
        setError("Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-[#f0f8ff]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            AIUB Class Scheduler
          </h1>
          <p className="text-lg text-gray-600">
            Create your perfect class schedule with{" "}
          </p>
          <a href="/doc" className="underline text-blue-600">
            How to use?
          </a>
        </header>

        {/* File Upload Section */}
        {!fileUploaded ? (
          <div className="mb-8 text-center">
            <label
              htmlFor="fileInput"
              className="block w-full max-w-md mx-auto p-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-300"
            >
              <div className="flex flex-col items-center">
                <svg
                  className="w-12 h-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-lg font-medium text-gray-700 mb-2">
                  Upload Excel File
                </span>
                <span className="text-sm text-gray-500">
                  Click to browse or drag and drop your AIUB course file
                </span>
              </div>
            </label>
            <input
              id="fileInput"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="mb-8 text-center">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-8 max-w-md mx-auto">
              <svg
                className="w-16 h-16 text-green-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                File Uploaded Successfully!
              </h2>
              <p className="text-xl font-semibold text-gray-700">
                Now you can select subjects
              </p>
            </div>
          </div>
        )}

        {/* Loading Progress */}
        {loading && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              Processing file... {progress}%
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-center text-red-600 font-medium mb-4">
            {error}
          </div>
        )}

        {/* Main Content */}
        {fileUploaded && (
          <main className="flex justify-center">
            <Autocomplete courses={courses} />
          </main>
        )}

        {/* Feedback Link */}
        <Link
          href="/feedback"
          className="fixed bottom-2 right-1 flex items-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg transition-all duration-300 text-sm z-50"
        >
          <span className="mr-1">📝</span>
          Feedback
        </Link>
      </div>
    </div>
  );
};

export default Home;
