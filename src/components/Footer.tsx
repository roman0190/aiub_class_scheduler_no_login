import React from "react";

const Footer = () => {
  return (
    <footer className="text-center p-4 bg-gray-100">
      <p className="text-gray-700">
        &copy; {new Date().getFullYear()} Your Company. All rights reserved.
      </p>
      <p className="text-gray-700">
        Developed by{" "}
        <a
          href="https://github.com/roman0190"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Roman Howladar
        </a>
      </p>
    </footer>
  );
};

export default Footer;
