"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Users,
  Plus,
  ArrowRight,
  BarChart3,
  Layers,
  Info,
  LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    content?: { badge?: string; titleAccent?: string };
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
      <div className="min-h-screen w-full p-6 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto" />
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen w-full p-6 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <p className="text-slate-300">Failed to load dashboard data</p>
      </div>
    );
  }

  const servicesMax = Math.max(stats.services.published, stats.services.draft, 1);
  const postsMax = Math.max(stats.posts.published, stats.posts.draft, 1);

  return (
    <div className="min-h-screen w-full p-6 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Welcome back, {userName || "User"}</h1>
          <p className="text-sm text-slate-400">Here's an overview of your content.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Services */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:border-indigo-500/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Total Services</h3>
              <div className="p-2 bg-indigo-500/20 rounded-md">
                <Layers className="h-4 w-4 text-indigo-400" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-white mb-3">{stats.services.total}</div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                {stats.services.published} published
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                {stats.services.draft} draft
              </span>
            </div>
          </div>

          {/* Posts */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Blog Posts</h3>
              <div className="p-2 bg-slate-700/50 rounded-md">
                <FileText className="h-4 w-4 text-slate-300" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-white mb-3">{stats.posts.total}</div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {stats.posts.published} published
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                {stats.posts.draft} draft
              </span>
            </div>
          </div>

          {/* Leads */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">Total Leads</h3>
              <div className="p-2 bg-slate-700/50 rounded-md">
                <Users className="h-4 w-4 text-slate-300" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-white mb-3">{stats.leads.total}</div>
            <span className="px-2 py-0.5 bg-slate-700/50 text-slate-300 rounded text-xs">
              {stats.leads.new} new
            </span>
          </div>

          {/* Users */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-slate-300">CMS Users</h3>
              <div className="p-2 bg-slate-700/50 rounded-md">
                <Users className="h-4 w-4 text-slate-300" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-white mb-3">{stats.users.total}</div>
            <p className="text-xs text-slate-400">Team members</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Services Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <h2 className="text-base font-semibold text-white">Services Status</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm text-slate-300">Published</span>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.services.published}</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${getBarWidth(stats.services.published, servicesMax)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-sm text-slate-300">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.services.draft}</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-500 rounded-full transition-all duration-500"
                    style={{ width: `${getBarWidth(stats.services.draft, servicesMax)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Blog Posts Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-4 w-4 text-slate-400" />
              <h2 className="text-base font-semibold text-white">Blog Posts Status</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-sm text-slate-300">Published</span>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.posts.published}</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${getBarWidth(stats.posts.published, postsMax)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-600" />
                    <span className="text-sm text-slate-300">Draft</span>
                  </div>
                  <span className="text-sm font-medium text-white">{stats.posts.draft}</span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-600 rounded-full transition-all duration-500"
                    style={{ width: `${getBarWidth(stats.posts.draft, postsMax)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Services */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-white mb-1">Recent Services</h2>
              <p className="text-xs text-slate-400">Your latest service pages</p>
            </div>
            <Link href="/dashboard/services">
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white h-8">
                View All <ArrowRight className="h-3 w-3 ml-1.5" />
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentServices.length > 0 ? (
              stats.recentServices.map((svc) => (
                <Link
                  key={svc._id}
                  href={`/dashboard/services/update-service?slug=${svc.slug}`}
                  className="block p-3 rounded-md bg-slate-900/50 border border-slate-700 hover:bg-slate-900/70 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <h4 className="text-sm font-medium text-white truncate">
                          {svc.content?.badge || svc.slug}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 ml-5">
                        <span>Updated {formatDate(svc.updatedAt)}</span>
                        {svc.author && <span>• {svc.author.username}</span>}
                      </div>
                    </div>
                    <span
                      className={`ml-3 px-2 py-0.5 rounded text-xs font-medium ${
                        svc.status === "published"
                          ? "bg-green-500/15 text-green-400"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {svc.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No services yet</p>
                <Link href="/dashboard/services/create-service">
                  <Button className="mt-3 bg-slate-700 hover:bg-slate-600 text-white" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Create Your First Service
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-white mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-400">Common tasks and shortcuts</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/dashboard/services/create-service">
              <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700 text-white border-0" variant="default">
                <Plus className="h-4 w-4 mr-2" /> Add Service
              </Button>
            </Link>
            <Link href="/dashboard/services">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-0" variant="default">
                <Layers className="h-4 w-4 mr-2" /> Services
              </Button>
            </Link>
            <Link href="/dashboard/blog/create-blog">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-0" variant="default">
                <FileText className="h-4 w-4 mr-2" /> New Post
              </Button>
            </Link>
            <Link href="/dashboard/leads">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-0" variant="default">
                <Users className="h-4 w-4 mr-2" /> Leads
              </Button>
            </Link>
            <Link href="/dashboard/about">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-0" variant="default">
                <Info className="h-4 w-4 mr-2" /> About Page
              </Button>
            </Link>
            <Link href="/dashboard/footer-menu">
              <Button className="w-full justify-start bg-slate-700 hover:bg-slate-600 text-white border-0" variant="default">
                <LayoutList className="h-4 w-4 mr-2" /> Footer Menu
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
