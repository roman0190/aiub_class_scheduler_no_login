import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIUB Class Scheduler | Smart Class Routine Generator",
  description:
    "Log in to AIUB Scheduler to generate clash-free, optimized class routines by selecting your preferred open credit courses. Built exclusively for AIUB students.",
  keywords: [
    "AIUB",
    "Class Scheduler",
    "Smart Routine Generator",
    "AIUB Scheduler",
  ],
  openGraph: {
    title: "AIUB Class Scheduler",
    description: "Smart Class Routine Generator for AIUB students.",
    url: "https://www.aiubclassscheduler.me/",
    siteName: "AIUB class Scheduler",
    type: "website",
    images: [
      {
        url: "https://www.aiubclassscheduler.me/_next/image?url=%2Flogo.png&w=256&q=75",
        width: 800,
        height: 600,
        alt: "AIUB Class Scheduler",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="lg:px-40 bg-[#f0f8ff]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
