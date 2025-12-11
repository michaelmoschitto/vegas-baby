"use server";

import { cookies } from "next/headers";

export async function validateVendorPassword(password: string) {
  if (!password) {
    return { success: false, error: "Password is required" };
  }

  const normalizedPassword = password.trim();

  if (normalizedPassword.length < 1) {
    return { success: false, error: "Password cannot be empty" };
  }

  const correctPassword = process.env.VENDOR_SETUP_PASSWORD;

  if (normalizedPassword === correctPassword) {
    const cookieStore = await cookies();
    cookieStore.set("vendor_setup_password", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });
    return { success: true };
  }

  return { success: false, error: "Invalid password" };
}
