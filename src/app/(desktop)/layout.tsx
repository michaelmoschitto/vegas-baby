"use client";

import Link from "next/link";

import { useVendor } from "@/components/shared/VendorContext";

function VendorGreeting() {
  const { vendorName } = useVendor();
  return (
    <span className="text-md text-gray-500">
      {vendorName ? (
        `Hi, ${vendorName}`
      ) : (
        <Link
          href="/pos/setup"
          className="text-md text-rose-600 hover:text-rose-700"
        >
          Setup vendor →
        </Link>
      )}
    </span>
  );
}

export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-rose-600">
                Vegas Baby
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/pos" className="text-gray-600 hover:text-rose-600">
                  POS
                </Link>
                <Link
                  href="/pos/setup"
                  className="text-gray-600 hover:text-rose-600"
                >
                  Vendor Setup
                </Link>
                <Link
                  href="/pos/display"
                  className="text-gray-600 hover:text-rose-600"
                >
                  Client POS Display
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <VendorGreeting />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-64px)]">{children}</main>
    </div>
  );
}
