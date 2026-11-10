"use client";

import {
  CircleUserRound,
  LogOut,
  MessageSquareText,
  Music2,
  Settings,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderTree,
  FileText,
  Users,
  Database,
  Info,
  Briefcase,
  List,
  ListStart,
  ListEnd,
  Contact,
  ScrollText,
  Package,
  House,
} from "lucide-react";
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
import { getUserProfile, UserProfile } from "@/lib/apiCallingProfile";
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

import { logout } from "@/lib/apiCallingAuth";

// Navigation items organized by category
const navigationItems = [
  {
    title: "Content",
    items: [
      {
        title: "Homepage",
        url: "/dashboard/homepage",
        icon: House,
      },
      {
        title: "Posts",
        url: "/dashboard/blog",
        icon: MessageSquareText,
        hasSubmenu: true,
        submenuItems: [
          {
            title: "All Posts",
            url: "/dashboard/blog",
            icon: FileText,
          },
          {
            title: "Add New Post",
            url: "/dashboard/blog/create-blog",
            icon: Plus,
          },
          {
            title: "Categories",
            url: "/dashboard/blog/category",
            icon: FolderTree,
          },
        ],
      },
      {
        title: "Services",
        url: "/dashboard/services",
        icon: Briefcase,
        hasSubmenu: true,
        submenuItems: [
          {
            title: "All Services",
            url: "/dashboard/services",
            icon: FileText,
          },
          {
            title: "Add New Service",
            url: "/dashboard/services/create-service",
            icon: Plus,
          },
        ],
      },
      {
        title: "Packages",
        url: "/dashboard/packages",
        icon: Package,
        hasSubmenu: true,
        submenuItems: [
          {
            title: "All Blocks",
            url: "/dashboard/packages",
            icon: FileText,
          },
          {
            title: "Add New Block",
            url: "/dashboard/packages/create-package",
            icon: Plus,
          },
        ],
      },
      {
        title: "Media Library",
        url: "/dashboard/media",
        icon: Music2,
      },
      {
        title: "Menus",
        url: "/dashboard/header-menu",
        icon: List,
        hasSubmenu: true,
        submenuItems: [
          {
            title: "Header Menu",
            url: "/dashboard/header-menu",
            icon: ListStart,
          },
          {
            title: "Footer Menu",
            url: "/dashboard/footer-menu",
            icon: ListEnd,
          },
        ],
      },
      {
        title: "About Us",
        url: "/dashboard/about",
        icon: Info,
      },
      {
        title: "Contact",
        url: "/dashboard/contact",
        icon: Contact,
      },
      {
        title: "Terms & Policy",
        url: "/dashboard/terms-policy",
        icon: ScrollText,
      },
      {
        title: "Leads",
        url: "/dashboard/leads",
        icon: Database,
      },
      {
        title: "Users",
        url: "/dashboard/users",
        icon: Users,
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

const filterNavigationItemsByRole = (
  items: typeof navigationItems,
  userRole: string | undefined,
) => {
  if (!userRole) return [];

  // SuperAdmin and Admin see everything
  if (userRole === "superadmin" || userRole === "admin") {
    return items;
  }

  // Editor and Contributor see content items
  if (userRole === "editor" || userRole === "contributor") {
    return items.map((group) => {
      if (group.title === "Content") {
        return {
          ...group,
          items: group.items.filter(
            (item) =>
              item.title === "Homepage" ||
              item.title === "Posts" ||
              item.title === "Media Library" ||
              item.title === "Menus" ||
              item.title === "Services" ||
              item.title === "About Us" ||
              item.title === "Contact",
          ),
        };
      }
      return group; // Keep Account group
    });
  }

  return [];
};

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { state: desktopState, isMobile, setOpenMobile } = useSidebar();
  // The mobile drawer is always full-width, so always render the expanded layout there.
  const state = isMobile ? "expanded" : desktopState;
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    posts: false,
  });

  // Close the mobile drawer after navigating
  useEffect(() => {
    setOpenMobile(false);
  }, [pathname, setOpenMobile]);

  // Fetch user profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserProfile();
        if (response.success && response.user) {
          setUserData(response.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

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
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      toast.error(error.message || "Failed to logout.", { closeButton: true });
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

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-800">
      <SidebarHeader className="border-b border-slate-800 p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <LayoutDashboard className="h-4 w-4" />
          </div>
          {state === "expanded" && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                JMT
              </span>
              <span className="text-xs text-slate-400">
                Content Management System
              </span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {filterNavigationItemsByRole(navigationItems, userData?.role).map(
          (group) => (
            <SidebarGroup key={group.title}>
              {state === "expanded" && (
                <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  {group.title}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
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
                              className="w-full text-white hover:bg-slate-800/50 hover:text-white"
                            >
                              <div
                                onClick={() => toggleSubmenu(submenuKey)}
                                className="flex items-center gap-3 w-full cursor-pointer"
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggleSubmenu(submenuKey);
                                  }
                                }}
                              >
                                <Icon className="h-4 w-4 text-white" />
                                <span className="flex-1 text-left">
                                  {item.title}
                                </span>
                                {isSubmenuOpen ? (
                                  <ChevronDown className="h-4 w-4 text-white" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-white" />
                                )}
                              </div>
                            </SidebarMenuButton>
                            <Collapsible.Content>
                              <SidebarMenuSub>
                                {item.submenuItems?.map((subItem) => {
                                  const SubIcon = subItem.icon;
                                  const subActive = isActive(subItem.url);

                                  return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                      <SidebarMenuSubButton
                                        asChild
                                        isActive={subActive}
                                        className={
                                          subActive
                                            ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                                            : "text-white hover:bg-slate-800/50 hover:text-white"
                                        }
                                      >
                                        <Link
                                          href={subItem.url}
                                          className="flex items-center gap-2"
                                        >
                                          <SubIcon
                                            className={`h-3.5 w-3.5 ${
                                              subActive
                                                ? "text-black"
                                                : "!text-white"
                                            }`}
                                          />
                                          <span>{subItem.title}</span>
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

                    // Regular menu item (no submenu or collapsed state)
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={`w-full ${
                            active
                              ? "bg-indigo-600/20 text-indigo-400 border-l-2 border-indigo-500"
                              : "text-white hover:bg-slate-800/50 hover:text-white"
                          }`}
                        >
                          <Link
                            href={item.url}
                            className="flex items-center gap-3"
                          >
                            <Icon
                              className={`h-4 w-4 ${
                                active ? "text-black" : "text-white"
                              }`}
                            />
                            {state === "expanded" && <span>{item.title}</span>}
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

      <SidebarFooter className="border-t border-slate-800 p-2">
        {state === "expanded" ? (
          <div className="w-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-800/50 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-indigo-600 text-white text-xs">
                      {loading ? (
                        <div className="h-full w-full bg-slate-700/50 rounded-full animate-pulse" />
                      ) : (
                        getInitials(userData?.username, userData?.email)
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col overflow-hidden gap-1">
                    {loading ? (
                      <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
                    ) : (
                      <span className="text-sm font-medium text-white truncate">
                        {userData?.username || "User"}
                      </span>
                    )}
                    {loading ? (
                      <div className="h-3 w-32 bg-slate-700 rounded animate-pulse" />
                    ) : (
                      <span className="text-xs text-slate-400 truncate">
                        {userData?.email || ""}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-slate-900 border-slate-800 text-white"
              >
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-400 hover:bg-transparent hover:text-red-300 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-800/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-indigo-600 text-white text-xs">
                    {loading
                      ? "..."
                      : getInitials(userData?.username, userData?.email)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="end"
              className="w-56 bg-slate-900 border-slate-800 text-white"
            >
              <DropdownMenuLabel className="text-slate-400">
                {loading ? "Loading..." : userData?.username || "User"}
              </DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-slate-500 font-normal">
                {loading ? "" : userData?.email || ""}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={() => router.push("/dashboard/profile")}
                className="text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <CircleUserRound className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-800" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
