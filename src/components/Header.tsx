"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link"; // Updated import
import { usePathname } from "next/navigation";
import { FaArrowLeft, FaInfoCircle } from "react-icons/fa"; // updated import

const Header = () => {
  const pathname = usePathname();
  const isDocsPage = pathname === "/about" || pathname === "/doc";

  return (
    <header className=" sticky lg:px-[10rem] top-0 flex justify-between items-center p-4 bg-gray-100 border-b border-gray-300 z-10">
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
          <Link href="/about" className="text-blue-500 hover:underline">
            <FaInfoCircle />
          </Link>
        </div>
      ) : (
        <div className="text-blue-500 hover:underline">
          <Link href="/">
            <FaArrowLeft />
          </Link>
        </div>
      )}
    </header>
  );
};

export default Header;
