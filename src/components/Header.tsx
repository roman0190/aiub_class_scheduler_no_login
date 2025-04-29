"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link"; // Updated import
import { usePathname } from "next/navigation";

const Header = () => {
  const pathname = usePathname();
  const isDocsPage = pathname === "/doc";

  return (
    <header className=" sticky top-0 flex justify-between items-center p-4 bg-gray-100 border-b border-gray-300 z-10">
      {/* Logo on the left */}
      <div className="text-xl font-bold text-gray-800 h-[50px] flex items-center justify-center">
        <Image
          src="/logo.png"
          className="object-cover"
          alt="alt"
          width={120}
          height={120}
        />
      </div>

      {/* "How to Use It" text on the right */}
      {!isDocsPage ? (
        <div>
          <Link href="/doc" className="text-blue-500 hover:underline">
            How to Use It?
          </Link>
        </div>
      ) : (
        <div className="text-blue-500 hover:underline">
          <Link href="/">Go Back</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
