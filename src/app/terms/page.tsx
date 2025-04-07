"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function TermsAndPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 py-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8"
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-blue-700">Terms and Policy</h1>
          <Link href="/">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Back to Login
            </button>
          </Link>
        </div>

        <div className="prose max-w-none">
          <section className="mb-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Terms of Use
            </h2>
            <p className="mb-3 text-gray-700">
              By accessing and using the AIUB Class Schedule Creator, you agree
              to comply with and be bound by the following terms and conditions:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li className="mb-2">
                This application is intended solely for AIUB students to create
                and manage their class schedules.
              </li>
              <li className="mb-2">
                You must use your valid AIUB credentials to access the
                application.
              </li>
              <li className="mb-2">
                Unauthorized access or attempts to compromise the system
                integrity are strictly prohibited.
              </li>
              <li className="mb-2">
                The application developers are not responsible for any
                inaccuracies in schedule information.
              </li>
              <li className="mb-2">
                Users should always verify their official schedules through the
                AIUB portal.
              </li>
              <li className="mb-2">
                This is an independent student project and is not created in
                collaboration with or endorsed by AIUB.
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Privacy Policy
            </h2>
            <p className="mb-3 text-gray-700">
              We take your privacy seriously. Here&apos;s how we handle your
              information:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li className="mb-2">
                Your AIUB credentials are used only for authentication purposes.
              </li>
              <li className="mb-2">
                We do not store your password at any point.
              </li>
              <li className="mb-2">
                Your schedule data is stored securely and is accessible only to
                you.
              </li>
              <li className="mb-2">
                We do not share your personal information with third parties.
              </li>
              <li className="mb-2">
                The application uses cookies and local storage to improve your
                experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-blue-600 mb-3">
              Disclaimer
            </h2>
            <p className="text-gray-700">
              The AIUB Class Schedule Creator is a student project developed to
              help AIUB students organize their class schedules efficiently. It
              is not an official AIUB application and has not been developed in
              collaboration with AIUB. This is solely a student initiative. This
              tool helps generate your routine, but always verify with the
              official source..
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
