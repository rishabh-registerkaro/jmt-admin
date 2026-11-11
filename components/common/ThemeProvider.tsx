"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Supabase-style: dark by default, user can switch to light/system. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
