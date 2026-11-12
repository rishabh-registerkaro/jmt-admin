"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Users,
  Plus,
  ArrowRight,
  Layers,
  Info,
  LayoutList,
  UserCog,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface DashboardStats {
  users: { total: number };
  services: { total: number; published: number; draft: number };
  posts: { total: number; published: number; draft: number };
  leads: { total: number; new: number };
  recentServices: Array<{
    _id: string;
    slug: string;
    status: "draft" | "published";
    updatedAt: string;
    title?: string;
    author?: { username: string };
  }>;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/auth/profile");
      const data = await res.json();
      if (data.success && data.user) setUserName(data.user.username || "User");
    } catch {}
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.success && data.data) setStats(data.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getBarWidth = (value: number, max: number) => {
    if (max === 0) return 0;
    return Math.max((value / max) * 100, 4);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Failed to load dashboard data
        </p>
      </div>
    );
  }

  const servicesMax = Math.max(stats.services.published, stats.services.draft, 1);
  const postsMax = Math.max(stats.posts.published, stats.posts.draft, 1);

  const statCards = [
    {
      label: "Total services",
      value: stats.services.total,
      icon: Layers,
      meta: (
        <>
          <Dot className="bg-brand" /> {stats.services.published} published
          <span className="mx-1.5 text-border">|</span>
          <Dot className="bg-muted-foreground/40" /> {stats.services.draft} draft
        </>
      ),
    },
    {
      label: "Blog posts",
      value: stats.posts.total,
      icon: FileText,
      meta: (
        <>
          <Dot className="bg-brand" /> {stats.posts.published} published
          <span className="mx-1.5 text-border">|</span>
          <Dot className="bg-muted-foreground/40" /> {stats.posts.draft} draft
        </>
      ),
    },
    {
      label: "Total leads",
      value: stats.leads.total,
      icon: Users,
      meta: (
        <Badge variant="default" className="px-1.5">
          {stats.leads.new} new
        </Badge>
      ),
    },
    {
      label: "CMS users",
      value: stats.users.total,
      icon: UserCog,
      meta: <>Team members</>,
    },
  ];

  const statusCards = [
    {
      title: "Services status",
      description: "Published vs. draft service pages",
      published: stats.services.published,
      draft: stats.services.draft,
      max: servicesMax,
    },
    {
      title: "Blog posts status",
      description: "Published vs. draft articles",
      published: stats.posts.published,
      draft: stats.posts.draft,
      max: postsMax,
    },
  ];

  const quickActions = [
    { href: "/dashboard/services/create-service", label: "Add service", icon: Plus, primary: true },
    { href: "/dashboard/services", label: "Services", icon: Layers },
    { href: "/dashboard/blog/create-blog", label: "New post", icon: FileText },
    { href: "/dashboard/leads", label: "Leads", icon: Users },
    { href: "/dashboard/about", label: "About page", icon: Info },
    { href: "/dashboard/footer-menu", label: "Footer menu", icon: LayoutList },
  ];

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Welcome back, {userName || "User"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s an overview of your content.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map(({ label, value, icon: Icon, meta }) => (
            <Card key={label} className="gap-3">
              <CardHeader>
                <CardDescription className="font-medium">{label}</CardDescription>
                <CardAction>
                  <Icon className="size-4 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-[28px] leading-none font-semibold tracking-tight tabular-nums">
                  {value}
                </div>
                <div className="flex items-center text-xs text-muted-foreground tabular-nums">
                  {meta}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statusCards.map((c) => (
            <Card key={c.title}>
              <CardHeader>
                <CardTitle>{c.title}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatusBar
                  label="Published"
                  value={c.published}
                  width={getBarWidth(c.published, c.max)}
                  barClass="bg-brand"
                />
                <StatusBar
                  label="Draft"
                  value={c.draft}
                  width={getBarWidth(c.draft, c.max)}
                  barClass="bg-muted-foreground/40"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Services */}
        <Card className="gap-0 pb-0">
          <CardHeader className="border-b">
            <CardTitle>Recent services</CardTitle>
            <CardDescription>Your latest service pages</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground">
                <Link href="/dashboard/services">
                  View all <ArrowRight className="ml-1 size-3.5" />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          {stats.recentServices.length > 0 ? (
            <ul className="divide-y">
              {stats.recentServices.map((svc) => (
                <li key={svc._id}>
                  <Link
                    href={`/dashboard/services/${svc._id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-hidden"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                      <Layers className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {svc.title || svc.slug}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Updated {formatDate(svc.updatedAt)}
                        {svc.author && <> · {svc.author.username}</>}
                      </p>
                    </div>
                    <Badge variant={svc.status === "published" ? "success" : "secondary"}>
                      {svc.status === "published" ? "Published" : "Draft"}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <Layers className="mx-auto mb-2 size-6 text-muted-foreground/60" />
              <p className="text-sm text-muted-foreground">No services yet</p>
              <Button size="sm" className="mt-3" asChild>
                <Link href="/dashboard/services/create-service">
                  <Plus className="mr-1.5 size-4" /> Create your first service
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
              {quickActions.map(({ href, label, icon: Icon, primary }) => (
                <Button
                  key={href}
                  asChild
                  variant={primary ? "default" : "outline"}
                  className="w-full justify-start"
                >
                  <Link href={href}>
                    <Icon className={`mr-1.5 size-4 ${primary ? "" : "text-muted-foreground"}`} />
                    {label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`mr-1.5 inline-block size-1.5 rounded-full ${className}`} />;
}

function StatusBar({
  label,
  value,
  width,
  barClass,
}: {
  label: string;
  value: number;
  width: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
