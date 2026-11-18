"use client";

import {
  CircleUserRound,
  LogOut,
  Music2,
  ChevronRight,
  ChevronDown,
  Plus,
  FileText,
  Users,
  Database,
  Info,
  Briefcase,
  List,
  ListStart,
  ListEnd,
  Contact,
  House,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsUpDown,
  HardHat,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "../ui/sidebar";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { usePermissions } from "./PermissionsProvider";
import { PERMISSIONS, type Permission } from "@/app/lib/constants/permissions";
import { ResetCacheButton } from "./ResetCacheButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import * as Collapsible from "@radix-ui/react-collapsible";
import { toast } from "sonner";
import { ThemeMenuItems } from "./ThemeMenuItems";
import { ThemeToggle } from "./ThemeToggle";

import { logout } from "@/lib/apiCallingAuth";

// Navigation — the admin site map. Each item (and sub-item) is shown only to
// users holding its `permission`; the same page → permission rules gate the
// pages themselves (app/lib/constants/routeAccess.ts) and the APIs behind them.
interface NavSubItem {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: Permission;
}
interface NavItem extends NavSubItem {
  hasSubmenu?: boolean;
  submenuItems?: NavSubItem[];
}
interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigationItems: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Content",
    items: [
      {
        title: "Homepage",
        url: "/dashboard/homepage",
        icon: House,
        permission: PERMISSIONS.CONTENT_EDIT,
      },
      // Posts (/dashboard/blog) and Packages (/dashboard/packages) are main-website
      // features, not used by the Joy Maa Tara site, so they're not linked here.
      // The pages and APIs are kept: the main website still reads its blog and
      // package blocks from this backend.
      {
        title: "Services",
        url: "/dashboard/services",
        icon: Briefcase,
        permission: PERMISSIONS.SERVICES_MANAGE,
        hasSubmenu: true,
        submenuItems: [
          { title: "All Services", url: "/dashboard/services", icon: FileText },
          { title: "Add New Service", url: "/dashboard/services/create-service", icon: Plus },
        ],
      },
      {
        title: "Media Library",
        url: "/dashboard/media",
        icon: Music2,
        permission: PERMISSIONS.MEDIA_MANAGE,
      },
      // Joy Maa Tara navbar and footer (app/dashboard/site-menus/[part]). The
      // main-website menu editors at /dashboard/header-menu and
      // /dashboard/footer-menu are no longer linked but still work by URL.
      {
        title: "Menus",
        url: "/dashboard/site-menus/header",
        icon: List,
        permission: PERMISSIONS.CONTENT_EDIT,
        hasSubmenu: true,
        submenuItems: [
          { title: "Header Menu", url: "/dashboard/site-menus/header", icon: ListStart },
          { title: "Footer Menu", url: "/dashboard/site-menus/footer", icon: ListEnd },
        ],
      },
      // Joy Maa Tara site pages (jmt-frontend /about, /contact, /join-our-crew),
      // all edited by app/dashboard/site-pages/[key]. The older main-website
      // editors at /dashboard/about and /dashboard/contact are no longer linked.
      {
        title: "About Us",
        url: "/dashboard/site-pages/about",
        icon: Info,
        permission: PERMISSIONS.CONTENT_EDIT,
      },
      {
        title: "Contact",
        url: "/dashboard/site-pages/contact",
        icon: Contact,
        permission: PERMISSIONS.CONTENT_EDIT,
      },
      {
        title: "Join Our Crew",
        url: "/dashboard/site-pages/join-our-crew",
        icon: HardHat,
        permission: PERMISSIONS.CONTENT_EDIT,
      },
    ],
  },
  {
    title: "Leads",
    items: [
      {
        title: "Leads",
        url: "/dashboard/leads",
        icon: Database,
        permission: PERMISSIONS.LEADS_VIEW,
      },
      {
        title: "Applications",
        url: "/dashboard/applications",
        icon: ClipboardList,
        permission: PERMISSIONS.APPLICATIONS_VIEW,
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
        permission: PERMISSIONS.USERS_MANAGE,
      },
      {
        title: "Roles",
        url: "/dashboard/roles",
        icon: ShieldCheck,
        permission: PERMISSIONS.ROLES_MANAGE,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/dashboard/profile",
        icon: CircleUserRound,
      },
    ],
  },
];

/** Keeps only the items (and sub-items) the user may open; drops empty groups. */
const filterNavigationByPermission = (
  groups: NavGroup[],
  can: (perm: Permission) => boolean,
  signedIn: boolean,
): NavGroup[] => {
  if (!signedIn) return [];
  const allowed = (perm?: Permission) => !perm || can(perm);
  return groups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => allowed(item.permission))
        .map((item) =>
          item.submenuItems
            ? { ...item, submenuItems: item.submenuItems.filter((sub) => allowed(sub.permission)) }
            : item,
        ),
    }))
    .filter((group) => group.items.length > 0);
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    visualState: state, // expanded when pinned, hovered, or on mobile
    state: pinnedState,
    isMobile,
    setOpenMobile,
    toggleSidebar,
    setHoverLock,
  } = useSidebar();
  const isPinned = pinnedState === "expanded";
  const { user: userData, loading, can } = usePermissions();
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    posts: false,
  });

  // Close the mobile drawer after navigating
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  // Auto-open submenu if current path matches - use useMemo to prevent unnecessary re-renders
  const shouldOpenSubmenus = useMemo(() => {
    const openStates: Record<string, boolean> = {};
    navigationItems.forEach((group) => {
      group.items.forEach((item) => {
        if (item.hasSubmenu && item.submenuItems) {
          const hasActive = item.submenuItems.some(
            (subItem) => pathname === subItem.url,
          );
          if (hasActive) {
            openStates[item.title.toLowerCase()] = true;
          }
        }
      });
    });
    return openStates;
  }, [pathname]);

  // Update submenu states only when pathname changes - merge to preserve manually opened menus
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- merges route-driven open state into manually toggled submenu state on navigation
    setOpenSubmenus((prev) => {
      const merged = { ...prev };
      Object.keys(shouldOpenSubmenus).forEach((key) => {
        if (shouldOpenSubmenus[key]) {
          merged[key] = true;
        }
      });
      return merged;
    });
  }, [shouldOpenSubmenus]);

  const handleLogout = async () => {
    const loadingToastId = toast.loading("Logging out...");
    try {
      const response = await logout();
      toast.dismiss(loadingToastId);
      toast.success(response.message || "Logged out successfully", {
        closeButton: true,
      });
      setTimeout(() => {
        router.push("/login");
      }, 500);
    } catch (error) {
      toast.dismiss(loadingToastId);
      // logout() rejects with either an Error or a plain { message } object
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      toast.error(message || "Failed to logout.", { closeButton: true });
      // Even if logout fails, redirect to login
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    }
  };

  const getInitials = (username?: string, email?: string) => {
    if (username) {
      return username.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  // Memoize active state check to prevent unnecessary re-renders
  const isActive = useCallback(
    (url: string) => {
      if (!pathname) return false;
      // Exact match only - no prefix matching to prevent multiple selections
      return pathname === url;
    },
    [pathname],
  );

  const toggleSubmenu = (key: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const initials = getInitials(userData?.username, userData?.email);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center justify-between gap-2 border-b border-sidebar-border px-3 py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-[13px] font-semibold tracking-tight text-[#121212]">
            J
          </div>
          {state === "expanded" && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-semibold text-foreground">
                JMT
              </span>
              <span className="truncate text-xs text-muted-foreground">
                Content Management
              </span>
            </div>
          )}
        </Link>
        {state === "expanded" && !isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                aria-pressed={isPinned}
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                {isPinned ? (
                  <PanelLeftClose className="size-4" />
                ) : (
                  <PanelLeftOpen className="size-4" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isPinned ? "Unpin sidebar" : "Pin sidebar"}
              <span className="ml-2 text-[11px] opacity-60">Ctrl B</span>
            </TooltipContent>
          </Tooltip>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {filterNavigationByPermission(navigationItems, can, !!userData).map(
          (group) => (
            <SidebarGroup key={group.title} className="px-0 py-1">
              <SidebarGroupLabel className="h-7 px-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.title}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const hasSubmenu = item.hasSubmenu && item.submenuItems;
                    const submenuKey = item.title.toLowerCase();
                    const isSubmenuOpen = openSubmenus[submenuKey] || false;

                    // Check if any submenu item is active
                    const hasActiveSubmenu = hasSubmenu
                      ? item.submenuItems?.some((subItem) =>
                          isActive(subItem.url),
                        )
                      : false;

                    // Only mark parent as active if no submenu item is active and the exact URL matches
                    const active = hasSubmenu
                      ? !hasActiveSubmenu && pathname === item.url
                      : isActive(item.url);

                    if (hasSubmenu && state === "expanded") {
                      return (
                        <Collapsible.Root
                          key={item.title}
                          open={isSubmenuOpen}
                          onOpenChange={() => toggleSubmenu(submenuKey)}
                        >
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              isActive={false}
                              className={`h-9 w-full gap-3 px-2.5 text-[13px] ${
                                hasActiveSubmenu
                                  ? "text-foreground"
                                  : "text-sidebar-foreground"
                              }`}
                            >
                              <div
                                onClick={() => toggleSubmenu(submenuKey)}
                                className="flex w-full cursor-pointer items-center gap-3"
                                role="button"
                                tabIndex={0}
                                aria-expanded={isSubmenuOpen}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggleSubmenu(submenuKey);
                                  }
                                }}
                              >
                                <Icon
                                  className={`size-4 ${
                                    hasActiveSubmenu
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  }`}
                                />
                                <span className="flex-1 truncate text-left">
                                  {item.title}
                                </span>
                                {isSubmenuOpen ? (
                                  <ChevronDown className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="size-3.5 text-muted-foreground" />
                                )}
                              </div>
                            </SidebarMenuButton>
                            <Collapsible.Content>
                              <SidebarMenuSub className="mr-0 ml-[1.15rem] gap-0.5 border-sidebar-border py-1 pr-0 pl-2.5">
                                {item.submenuItems?.map((subItem) => {
                                  const SubIcon = subItem.icon;
                                  const subActive = isActive(subItem.url);

                                  return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={subActive}
                                        className={`h-8 text-[13px] ${
                                          subActive
                                            ? "bg-sidebar-active font-medium text-sidebar-active-foreground shadow-sm hover:bg-sidebar-active hover:text-sidebar-active-foreground dark:shadow-none data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-active-foreground"
                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                                        }`}
                                      >
                                        <Link
                                          href={subItem.url}
                                          className="flex items-center gap-2"
                                        >
                                          <SubIcon
                                            className={`size-3.5 ${
                                              subActive
                                                ? "text-sidebar-active-foreground!"
                                                : "text-muted-foreground!"
                                            }`}
                                          />
                                          <span className="truncate">
                                            {subItem.title}
                                          </span>
                                        </Link>
                                      </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                  );
                                })}
                              </SidebarMenuSub>
                            </Collapsible.Content>
                          </SidebarMenuItem>
                        </Collapsible.Root>
                      );
                    }

                    // Regular menu item (no submenu, or collapsed rail)
                    const railActive = active || hasActiveSubmenu;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={railActive}
                          className={`h-9 w-full gap-3 px-2.5 text-[13px] ${
                            railActive
                              ? "bg-sidebar-active font-medium text-sidebar-active-foreground shadow-sm hover:bg-sidebar-active hover:text-sidebar-active-foreground dark:shadow-none data-[active=true]:bg-sidebar-active data-[active=true]:text-sidebar-active-foreground"
                              : "text-sidebar-foreground"
                          }`}
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-3"
                            aria-label={item.title}
                          >
                            <Icon
                              className={`size-4 ${
                                railActive
                                  ? "text-sidebar-active-foreground"
                                  : "text-muted-foreground"
                              }`}
                            />
                            {state === "expanded" && (
                              <span className="truncate">{item.title}</span>
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ),
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {/* Clears every cached page on both websites — admins only (the API enforces it too) */}
        {can(PERMISSIONS.CACHE_RESET) && (
          <div className={state === "expanded" ? "" : "flex justify-center"}>
            <ResetCacheButton collapsed={state !== "expanded"} />
          </div>
        )}
        {state === "expanded" ? (
          <div className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
          <DropdownMenu onOpenChange={setHoverLock}>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[state=open]:bg-sidebar-accent">
                <Avatar className="size-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-secondary text-xs font-medium text-foreground">
                    {loading ? (
                      <div className="size-full animate-pulse rounded-md bg-muted" />
                    ) : (
                      initials
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-tight">
                  {loading ? (
                    <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                  ) : (
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {userData?.username || "User"}
                    </span>
                  )}
                  {loading ? (
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                  ) : (
                    <span className="truncate text-xs text-muted-foreground">
                      {userData?.email || ""}
                    </span>
                  )}
                </div>
                <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side={isMobile ? "top" : "right"}
              align="end"
              sideOffset={8}
              className="w-56"
            >
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
                className="cursor-pointer"
              >
                <CircleUserRound className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeMenuItems />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 size-4 text-destructive" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
            </div>
            <ThemeToggle />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex size-10 items-center justify-center rounded-md transition-colors hover:bg-sidebar-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                <Avatar className="size-8 rounded-md">
                  <AvatarFallback className="rounded-md bg-secondary text-xs font-medium text-foreground">
                    {loading ? "…" : initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={8}
              className="w-56"
            >
              <DropdownMenuLabel className="pb-0 text-[13px] font-medium">
                {loading ? "Loading..." : userData?.username || "User"}
              </DropdownMenuLabel>
              <DropdownMenuLabel className="pt-0.5 text-xs font-normal text-muted-foreground">
                {loading ? "" : userData?.email || ""}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
                className="cursor-pointer"
              >
                <CircleUserRound className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <ThemeMenuItems />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 size-4 text-destructive" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
