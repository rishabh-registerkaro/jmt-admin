"use client";
import { AppSidebar } from "@/components/common/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useRoutePermission } from "@/hooks/useRoutePermission";
import AccessDenied from "@/components/common/AccessDenied";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/common/ThemeToggle";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { loading, hasAccess } = useRoutePermission();
  return (
    // Collapsed icon rail by default; it slides out on hover and can be pinned.
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        {/* Mobile top bar: the sidebar becomes an off-canvas drawer below md */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur md:hidden">
          <SidebarTrigger className="text-muted-foreground" />
          <span className="text-sm font-semibold">JMT CMS</span>
          <ThemeToggle className="ml-auto" />
        </header>
        {/* overflow-x-clip (not overflow-auto): stops sideways page scroll on phones
            without becoming a scroll container, so the editors' sticky Save bars stick. */}
        <div className="flex-1 w-full min-w-0 overflow-x-clip">
          {loading ? (
            <div className="min-h-screen w-full bg-background p-4 sm:p-6">
              <div className="mx-auto max-w-7xl space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>

                <div className="space-y-4 rounded-lg border bg-card p-6 shadow-xs">
                  <Skeleton className="h-5 w-32" />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border bg-card p-6 shadow-xs">
                  <Skeleton className="h-5 w-40" />
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 overflow-hidden"
                      >
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : hasAccess ? (
            children
          ) : (
            <AccessDenied />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
