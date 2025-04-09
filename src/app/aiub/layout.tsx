import Header from "@/components/Header";
import React from "react";
interface AiubLayoutProps {
  children: React.ReactNode;
}

export default function AiubLayout({ children }: AiubLayoutProps) {
  return (
    <div className=" relative">
      <Header />
      <div className="lg:px-40 bg-[#f0f8ff]">{children}</div>
    </div>
  );
}
