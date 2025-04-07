"use client";
import React from "react";
import { useAuth } from "../../context/AuthContext";
import Autocomplete from "@/components/Autocomplete";

const Home = () => {
  const { data } = useAuth();

  const courses = data?.courses || [];
 
  // debugger;
  return (
    <div className="min-h-screen bg-[#f0f8ff] p-3 md:p-6">
      {/* Main Content */}
      <main className="flex justify-center">
        <Autocomplete courses={courses} />
      </main>
    </div>
  );
};

export default Home;
