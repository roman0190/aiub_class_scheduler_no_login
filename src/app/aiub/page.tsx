"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import Autocomplete from "@/components/Autocomplete";
import { MessageSquare } from "lucide-react";
import Link from "next/link";
const Home = () => {
  const { data } = useAuth();

  const courses = data?.courses || [];

  // debugger;
  return (
    <div className="min-h-screen relative bg-[#f0f8ff] ">
      {/* Main Content */}
      <main className="flex justify-center">
        <Autocomplete courses={courses} />
      </main>

      <Link
        href="/feedback"
        className={` fixed bottom-2 right-1 flex items-center gap-1 text-sm px-3 py-2 rounded-md transition-colors bg-green-400/75 text-blue-950 shadow-2xl z-10`}
        title="Send Feedback"
      >
        <MessageSquare size={18} />
        <span className="hidden sm:inline">Feedback</span>
      </Link>
    </div>
  );
};

export default Home;
