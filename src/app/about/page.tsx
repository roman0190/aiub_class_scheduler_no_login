import React from "react";
import {
  FiSpeaker,
  FiBookOpen,
  FiShield,
  FiZap,
  FiLink,
  FiUser,
  FiCheckCircle,
} from "react-icons/fi";
import { FaDiscord, FaGithub, FaMapPin, FaGift } from "react-icons/fa";

const About = () => {
  return (
    <div className="p-6 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold text-blue-600 mb-4 flex items-center">
        <FiSpeaker className="h-6 w-6 mr-2" />
        Hello AIUBians!
      </h1>
      <p className="text-lg mb-6">
        Pre-registration is coming — tired of manually matching courses,
        sections, and timings? Here’s the perfect solution to your
        routine-making stress!
      </p>

      <h2 className="text-2xl font-semibold text-blue-500 mb-4 flex items-center">
        <FiBookOpen className="h-6 w-6 mr-2" />
        Introducing: AIUB Class Scheduler
      </h2>
      <p className="text-lg mb-6">
        A smart web-app that automatically generates clash-free class routines
        for Open Credit students!
      </p>

      <hr className="border-gray-300 my-6" />

      <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
        <FiZap className="h-6 w-6 mr-2" />
        Key Features:
      </h3>
      <ul className="list-disc list-inside space-y-2 mb-6">
        <li>
          Select only course names — no need to browse each section manually
        </li>
        <li>Only OPEN status sections are shown</li>
        <li>Multiple clash-free schedule combinations</li>
        <li>Smart conflict detection and time slot prioritization</li>
        <li>Mobile-friendly and easy to use</li>
        <li>Export routine as a Word (.docx) file</li>
      </ul>

      <hr className="border-gray-300 my-6" />

      <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
        <FiShield className="h-6 w-6 mr-2" />
        Secure Usage — No Login Needed!
      </h3>
      <p className="mb-6">
        Login has been removed from the app. You can now securely use the system
        by simply uploading the official XLSX file of offered courses
        (downloaded from the AIUB Portal).
      </p>
      <ul className="list-disc list-inside space-y-2 mb-6">
        <li>
          <FiCheckCircle className="inline-block h-5 w-5 text-green-500 mr-2" />
          No ID/password required
        </li>
        <li>
          <FiCheckCircle className="inline-block h-5 w-5 text-green-500 mr-2" />
          Nothing stored or shared — runs fully in your browser
        </li>
      </ul>

      <hr className="border-gray-300 my-6" />

      <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
        <FiZap className="h-6 w-6 mr-2" />
        How It Works (Updated):
      </h3>
      <ol className="list-decimal list-inside space-y-2 mb-6">
        <li>Login to the AIUB Portal</li>
        <li>Download the &quot;Offered Courses&quot; Excel (.xlsx) file</li>
        <li>
          Visit:{" "}
          <a
            href="https://www.aiubclassscheduler.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            https://www.aiubclassscheduler.me/
          </a>
        </li>
        <li>Upload the file</li>
        <li>Select your preferred courses</li>
        <li>Instantly generate clash-free schedules</li>
        <li>Export your routine if needed!</li>
      </ol>

      <hr className="border-gray-300 my-6" />

      <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center">
        <FiLink className="h-6 w-6 mr-2" />
        Try it now:
      </h3>
      <p className="mb-6">
        <a
          href="https://www.aiubclassscheduler.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          https://www.aiubclassscheduler.me/
        </a>
      </p>

      <h3 className="text-xl font-semibold text-blue-400 flex items-center mb-4">
        <FiUser className="h-6 w-6 mr-2" />
        Developed by:
        <a href="https://roman0190.github.io/portfolio/" target="_blank" className="text-blue-500 underline ml-2">
          Roman Howladar
        </a>
      </h3>
      <p className="mb-6">
        <FaDiscord className="inline-block h-5 w-5 text-indigo-500 mr-2" />
        Join our Discord:{" "}
        <a
          href="https://discord.com/invite/jstr5NW6"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          https://discord.com/invite/jstr5NW6
        </a>
        <br />
        <FaGithub className="inline-block h-5 w-5 text-gray-700 mr-2" />
        Open-source on GitHub:{" "}
        <a
          href="https://github.com/roman0190/aiub_class_scheduler_no_login.git"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 underline"
        >
          https://github.com/roman0190/aiub_class_scheduler_no_login.git
        </a>
      </p>

      <hr className="border-gray-300 my-6" />

      <p className="font-semibold mb-4 flex items-center">
        <FaMapPin className="h-5 w-5 text-red-500 mr-2" />
        Note:
      </p>
      <ul className="list-disc list-inside space-y-2 mb-6">
        <li>This is a beta version — more features coming soon!</li>
      </ul>

      <p className="text-center font-bold text-blue-600 flex items-center justify-center">
        <FaGift className="h-5 w-5 text-pink-500 mr-2" />
        Thanks for your support, and happy scheduling!
      </p>
    </div>
  );
};

export default About;
