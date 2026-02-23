"use server";

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const privateRoutes = [""];
const authRoutes = [""];

export function proxy(request: NextRequest) {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((cookie) => cookie.startsWith("accessToken="))
    ?.split("=")[1];

  // nếu route là private và không có token thì redirect đến login
  if (privateRoutes.includes(request.nextUrl.pathname) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // nếu route là auth và có token thì redirect đến me
  if (authRoutes.includes(request.nextUrl.pathname) && token) {
    return NextResponse.redirect(new URL("/me", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [],
};
