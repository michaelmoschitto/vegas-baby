"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface VendorContextType {
  vendorName: string;
  vendorId: string;
  defaultPrice: number | null;
  setVendorName: (name: string) => void;
  setVendorId: (id: string) => void;
  setDefaultPrice: (price: number | null) => void;
  hydrated: boolean;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: React.ReactNode }) => {
  const [vendorName, setVendorNameState] = useState<string>("");
  const [vendorId, setVendorIdState] = useState<string>("");
  const [defaultPrice, setDefaultPriceState] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const storedName =
      typeof window !== "undefined" ? localStorage.getItem("vendorName") : null;
    const storedId =
      typeof window !== "undefined" ? localStorage.getItem("vendorId") : null;
    const storedPrice =
      typeof window !== "undefined"
        ? localStorage.getItem("vendorDefaultPrice")
        : null;
    if (storedName) setVendorNameState(storedName);
    if (storedId) setVendorIdState(storedId);
    if (storedPrice) setDefaultPriceState(Number(storedPrice));
    setHydrated(true);
  }, []);

  // Save to localStorage whenever vendorName or vendorId changes
  const setVendorName = (name: string) => {
    setVendorNameState(name);
    if (typeof window !== "undefined") {
      localStorage.setItem("vendorName", name);
    }
  };

  const setVendorId = (id: string) => {
    setVendorIdState(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("vendorId", id);
    }
  };

  const setDefaultPrice = (price: number | null) => {
    setDefaultPriceState(price);
    if (typeof window !== "undefined") {
      if (price !== null) {
        localStorage.setItem("vendorDefaultPrice", String(price));
      } else {
        localStorage.removeItem("vendorDefaultPrice");
      }
    }
  };

  return (
    <VendorContext.Provider
      value={{
        vendorName,
        vendorId,
        defaultPrice,
        setVendorName,
        setVendorId,
        setDefaultPrice,
        hydrated,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export function useVendor() {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendor must be used within a VendorProvider");
  return ctx;
}
