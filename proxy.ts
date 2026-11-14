import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export default function proxy(req: NextRequest) {
  const token = req.cookies.get("authToken")?.value;
  const pathname = req.nextUrl.pathname;

  // The public homepage now lives in the separate jmt-frontend project, so
  // "/" here is just the admin entry point: /login when signed out, and
  // app/page.tsx sends signed-in users on to /dashboard.

  // /signup is disabled — user creation is handled by admins via the dashboard
  // const isPublic =pathname === "/login" ||pathname === "/signup" || pathname === "/forgot-password";
  const isPublic = pathname === "/login" || pathname === "/forgot-password";
  if (!token) {
    if (isPublic) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (isPublic || pathname === "/signup") {
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
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    // App-icon files are served from the app directory like any other route, so
    // they must be exempted here or an unauthenticated request for the favicon
    // is redirected to /login and the browser receives HTML instead of a PNG.
    // `homepage/` holds the public homepage's static images (public/homepage).
    // `service/` holds the service page default photos (public/service), shown in editor previews.
    // `about/`, `join/` and `contact/` hold the site pages' default photos and icons (copies of
    // jmt-frontend/public), shown in the Website pages editor previews.
    // robots.txt must reach crawlers (app/robots.ts: Disallow /) instead of
    // being redirected to /login.
    "/((?!_next|api|homepage/|service/|about/|join/|contact/|favicon.ico|icon.svg|icon.png|apple-icon.png|robots.txt).*)",
  ],
};
