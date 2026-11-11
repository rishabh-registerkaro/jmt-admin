"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

/** Theme picker for a dropdown menu (Supabase-style: Dark / Light / System). */
export function ThemeMenuItems() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
        Theme
      </DropdownMenuLabel>
      <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
        <DropdownMenuRadioItem value="dark" className="cursor-pointer">
          <Moon className="mr-2 size-4" /> Dark
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="light" className="cursor-pointer">
          <Sun className="mr-2 size-4" /> Light
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="system" className="cursor-pointer">
          <Monitor className="mr-2 size-4" /> System
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </>
  );
}
