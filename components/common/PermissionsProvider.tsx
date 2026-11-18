"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getUserProfile, type UserProfile } from "@/lib/apiCallingProfile";
import type { Permission } from "@/app/lib/constants/permissions";

interface PermissionsContextValue {
  user: UserProfile | null;
  permissions: readonly string[];
  /** True if the signed-in user has the permission (or any of them, for a list). */
  can: (perm: Permission | readonly Permission[]) => boolean;
  loading: boolean;
  /** Re-fetch the profile (e.g. after the signed-in user's own role changed). */
  refresh: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

/**
 * Loads the signed-in user's role + permissions once per page navigation
 * (so a role change made by an admin applies on the user's next click) and
 * shares it with the sidebar, the route gate and the pages.
 */
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    () =>
      getUserProfile()
        .then((res) => (res.success && res.user ? res.user : null))
        .catch(() => null),
    [],
  );

  const refresh = useCallback(async () => {
    const next = await load();
    setUser((prev) => next ?? prev);
    setLoading(false);
  }, [load]);

  useEffect(() => {
    let alive = true;
    load().then((next) => {
      if (!alive) return;
      // Keep the last known access on a failed refresh; the APIs still enforce it.
      setUser((prev) => next ?? prev);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [pathname, load]);

  const value = useMemo<PermissionsContextValue>(() => {
    const permissions = user?.permissions ?? [];
    return {
      user,
      permissions,
      can: (perm) => {
        const wanted = Array.isArray(perm) ? perm : [perm as Permission];
        return wanted.some((p) => permissions.includes(p));
      },
      loading,
      refresh,
    };
  }, [user, loading, refresh]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error("usePermissions must be used inside <PermissionsProvider> (app/dashboard/layout.tsx)");
  return ctx;
}
