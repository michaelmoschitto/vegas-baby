"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import POSDisplay from "@/components/pos-display/POSDisplay";
import { useVendor } from "@/components/shared/VendorContext";

export default function POSDisplayPage() {
  const { vendorName, vendorId, hydrated } = useVendor();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && (!vendorName || !vendorId)) {
      // If vendor context is lost, redirect to setup

      console.log(
        "[POSDisplayPage] No vendor context found, redirecting to setup"
      );
      router.push("/pos/setup");
    }
  }, [hydrated, vendorName, vendorId, router]);

  if (!hydrated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-rose-50 to-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Setting up your display</p>
        </div>
      </div>
    );
  }

  if (!vendorName || !vendorId) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-rose-50 to-white">
      <POSDisplay />
    </div>
  );
}
