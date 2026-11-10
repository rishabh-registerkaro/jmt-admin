import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export default function proxy(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const pathname = req.nextUrl.pathname;

  // /signup is disabled — user creation is handled by admins via the dashboard
  // const isPublic =pathname === "/login" ||pathname === "/signup" || pathname === "/forgot-password";
  const isPublic = pathname === "/login" || pathname === "/forgot-password";
  if (!token) {
    if (isPublic) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isPublic || pathname === "/" || pathname === "/signup") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      username: string;
      role: string;
    };

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-id", decoded.id);
    requestHeaders.set("x-username", decoded.username);
    requestHeaders.set("x-user-role", decoded.role);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (err) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    // App-icon files are served from the app directory like any other route, so
    // they must be exempted here or an unauthenticated request for the favicon
    // is redirected to /login and the browser receives HTML instead of a PNG.
    "/((?!_next|api|favicon.ico|icon.png|apple-icon.png).*)",
  ],
};
