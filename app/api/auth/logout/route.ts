import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged Out Successfully" });
  // Same attributes as when set (api/auth/login), so browsers replace them.
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("authToken", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure,
    sameSite: "strict",
  });
  response.cookies.set("loggedIn", "", {
    expires: new Date(0),
    path: "/",
    secure,
    sameSite: "strict",
  });

  return response
}
