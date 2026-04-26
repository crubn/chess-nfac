import { NextResponse, type NextRequest } from "next/server";
import { UID_COOKIE } from "@/lib/subscription/cookies";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(UID_COOKIE)) {
    res.cookies.set(UID_COOKIE, crypto.randomUUID(), {
      path: "/",
      maxAge: ONE_YEAR * 2,
      sameSite: "lax",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
