import { redirect } from "next/navigation";

// The public homepage lives in the separate jmt-frontend project. Here "/" is
// only the admin entry point: proxy.ts sends signed-out visitors to /login,
// and signed-in users land on the dashboard.
export default function AdminRoot() {
  redirect("/dashboard");
}
