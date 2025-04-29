"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import Autocomplete from "@/components/Autocomplete";
import { MessageSquare, Upload } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

const Home = () => {
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

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

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
      {/* File Upload Section */}
      <div className="flex flex-col items-center pt-4 pb-8">
        <label className="cursor-pointer flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
          <Upload size={20} />
          <span>Upload Excel File</span>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <p className="mt-2 text-sm text-gray-600">
          Note: Download the .xlsx file from "Offered Courses" and upload it
          here. Do not reload the page — reloading will require you to upload
          the file again.{" "}
          <Link href="/doc" className="text-blue-500 hover:underline">
            See more here.
          </Link>
        </p>
      </div>

      {/* Loading Bar */}
      {loading && (
        <div className="w-full bg-gray-200 h-2 rounded-md overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center text-red-600 font-medium mb-4">{error}</div>
      )}

      {/* Main Content */}
      <main className="flex justify-center">
        <Autocomplete courses={courses} />
      </main>

      <Link
        href="/feedback"
        className={`fixed bottom-2 right-1 flex items-center gap-1 text-sm px-3 py-2 rounded-md transition-colors bg-green-400/75 text-blue-950 shadow-2xl z-10`}
        title="Send Feedback"
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline">Feedback</span>
      </Link>
    </div>
  );
};

export default Home;
