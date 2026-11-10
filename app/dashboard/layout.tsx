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

export default function Layout({ children }: { children: React.ReactNode }) {
  const { loading, hasAccess} = useRoutePermission();
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        {/* Mobile top bar: the sidebar becomes an off-canvas drawer below md */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-800 bg-[rgb(2,18,47)] px-4 text-white md:hidden">
          <SidebarTrigger className="text-white hover:bg-slate-800 hover:text-white" />
          <span className="text-sm font-semibold">JMT CMS</span>
        </header>
        {/* <main className="flex-1 w-full  overflow-auto">{children}</main> */}
        <main className="flex-1 w-full min-w-0 overflow-auto">
          {loading ? (
           <div className="min-h-screen w-full p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
           <div className="max-w-7xl mx-auto space-y-6">
             {/* Header Skeleton */}
             <div className="space-y-2">
               <Skeleton className="h-9 w-48 bg-slate-700/50" />
               <Skeleton className="h-5 w-64 bg-slate-700/50" />
             </div>

             {/* Card Skeleton */}
             <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 space-y-4">
               <Skeleton className="h-6 w-32 bg-slate-700/50" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Skeleton className="h-10 w-full bg-slate-700/50" />
                 <Skeleton className="h-10 w-full bg-slate-700/50" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Skeleton className="h-24 w-full bg-slate-700/50" />
                 <Skeleton className="h-24 w-full bg-slate-700/50" />
                 <Skeleton className="h-24 w-full bg-slate-700/50" />
               </div>
             </div>

             {/* Table Skeleton */}
             <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl p-6 space-y-4">
               <Skeleton className="h-6 w-40 bg-slate-700/50" />
               <div className="space-y-3">
                 {Array.from({ length: 5 }).map((_, index) => (
                   <div key={index} className="flex items-center gap-4 overflow-hidden">
                     <Skeleton className="h-4 w-32 bg-slate-700/50" />
                     <Skeleton className="h-4 w-48 bg-slate-700/50" />
                     <Skeleton className="h-4 w-40 bg-slate-700/50" />
                     <Skeleton className="h-4 w-24 bg-slate-700/50" />
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
