import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export default auth((req: NextRequest) => {
  const session = req.auth;
  const isAdmin = req.nextUrl.pathname.startsWith("/admin");

  if (!isAdmin) return NextResponse.next();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (req.nextUrl.pathname.startsWith("/admin/recap") && session.user.role !== "teacher") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*"] };
