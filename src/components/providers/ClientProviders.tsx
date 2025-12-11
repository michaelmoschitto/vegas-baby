"use client";

import { VendorProvider } from "@/components/shared/VendorContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorProvider>{children}</VendorProvider>;
}
