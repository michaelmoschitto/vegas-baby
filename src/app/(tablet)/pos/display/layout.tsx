"use client";
import { Inter } from "next/font/google";
import type React from "react";
import "@/app/globals.css";
const inter = Inter({ subsets: ["latin"] });

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={inter.className}>{children}</div>;
}
