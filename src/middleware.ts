import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Only protect the vendor setup route
  if (request.nextUrl.pathname === "/pos/setup") {
    // Check if the user has the correct password in their session
    const hasPassword = request.cookies.get("vendor_setup_password");

    if (!hasPassword) {
      // Redirect to password page if no password is set
      return NextResponse.redirect(new URL("/pos/setup/password", request.url));
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/pos/setup",
};
