import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged Out Successfully" });
  response.cookies.set("authToken", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
  });
  response.cookies.set("loggedIn", "", {
    expires: new Date(0),
    path: "/",
  });

  return response
}
