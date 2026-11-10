"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Header() {
  const router = useRouter();
  const pathname=usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const tokenExists = typeof document !== "undefined" && document.cookie.includes("loggedIn=true");
    setIsAuthenticated(tokenExists);
  }, [pathname]);


  console.log("IS authenticated user", isAuthenticated)
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <header className="w-full bg-black text-white flex items-center justify-between px-6 py-4 shadow-md">
      <h1 
        className="text-xl font-bold cursor-pointer"
        onClick={() => router.push("/")}
      >
        Registerkaro-CMS
      </h1>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-sm rounded-md transition"
          >
            Logout
          </button>
        ) : (
          <>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-sm rounded-md transition"
            >
              Login
            </button>
          </>
        )}
      </div>
    </header>
  );
}
