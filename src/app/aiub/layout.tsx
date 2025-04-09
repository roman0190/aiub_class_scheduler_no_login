import Header from "@/components/Header";
import React from "react";
interface AiubLayoutProps {
  children: React.ReactNode;
}

export default function AiubLayout({ children }: AiubLayoutProps) {
  return (
    <div className=" relative">
      <Header />
      {children}
    </div>
  );
}