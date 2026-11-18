"use client";

// Overview of what needs doing today. Sections are driven by /api/dashboard,
// which returns only the ones the signed-in user may see.

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ClipboardList,
  FilePen,
  Inbox,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePermissions } from "@/components/common/PermissionsProvider";
import { cn } from "@/lib/utils";

type Status = "new" | "contacted" | "converted" | "lost";
type StatusCounts = Record<Status, number>;

interface RankedRow {
  label: string;
  count: number;
}

interface Person {
  id: string;
  name: string;
  phoneNo: string;
  status: Status;
  createdAt: string;
}

interface Enquiry extends Person {
  need: string;
  location: string;
  crew: string;
}

interface Application extends Person {
  trade: string;
  experience: string;
  location: string;
}

interface ActivityDay {
  date: string;
  enquiries: number;
  applications: number;
}

interface DashboardData {
  generatedAt: string;
  activity: ActivityDay[] | null;
  enquiries: {
    total: number;
    byStatus: StatusCounts;
    oldestNewAt: string | null;
    sources: RankedRow[];
    recent: Enquiry[];
  } | null;
  applications: {
    total: number;
    byStatus: StatusCounts;
    oldestNewAt: string | null;
    trades: RankedRow[];
    recent: Application[];
  } | null;
  services: {
    total: number;
    published: number;
    draft: number;
    recent: Array<{ id: string; slug: string; title: string; status: "draft" | "published"; updatedAt: string }>;
  } | null;
  pages: Array<{ title: string; href: string; updatedAt: string | null }> | null;
}

const TIME_ZONE = "Asia/Kolkata";

const ENQUIRY_LABELS: Record<Status, string> = { new: "New", contacted: "Contacted", converted: "Converted", lost: "Lost" };
const APPLICATION_LABELS: Record<Status, string> = { new: "New", contacted: "Contacted", converted: "Hired", lost: "Rejected" };

const STATUS_ORDER: Status[] = ["new", "contacted", "converted", "lost"];
const STATUS_FILL: Record<Status, string> = {
  new: "bg-warning",
  contacted: "bg-chart-2",
  converted: "bg-success",
  lost: "bg-muted-foreground/40",
};
const STATUS_BADGE: Record<Status, "warning" | "secondary" | "success" | "destructive"> = {
  new: "warning",
  contacted: "secondary",
  converted: "success",
  lost: "destructive",
};

const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`;

function formatDay(date: string | Date, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  const value = typeof date === "string" && date.length === 10 ? `${date}T12:00:00+05:30` : date;
  return new Date(value).toLocaleDateString("en-GB", { timeZone: TIME_ZONE, ...options });
}

function timeAgo(iso: string, now: string) {
  const minutes = Math.max(0, Math.floor((new Date(now).getTime() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return formatDay(iso, { day: "numeric", month: "short", year: "numeric" });
}

function waitingFor(iso: string, now: string) {
  const hours = Math.max(0, Math.floor((new Date(now).getTime() - new Date(iso).getTime()) / 3600000));
  if (hours < 1) return "Arrived in the last hour";
  if (hours < 24) return `Oldest has waited ${plural(hours, "hour")}`;
  return `Oldest has waited ${plural(Math.floor(hours / 24), "day")}`;
}

function greeting(iso: string) {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" }).format(new Date(iso)),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function summaryLine(data: DashboardData) {
  const waiting = [
    data.enquiries?.byStatus.new ? plural(data.enquiries.byStatus.new, "new enquiry", "new enquiries") : "",
    data.applications?.byStatus.new ? plural(data.applications.byStatus.new, "new application") : "",
  ].filter(Boolean);
  if (waiting.length > 0) return `${waiting.join(" and ")} waiting for a reply.`;
  if (data.services?.draft) return `${plural(data.services.draft, "service draft")} not live on the website yet.`;
  return "You're all caught up.";
}

/** wa.me needs digits only, with country code; bare 10-digit Indian numbers get 91. */
function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

export default function Dashboard() {
  const { user } = usePermissions();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setData(json.data);
      setFailed(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount; the fetcher sets state
    load();
  }, [load]);

  if (loading) return <DashboardSkeleton />;

  if (!data) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-muted-foreground">We couldn&apos;t load your dashboard.</p>
        <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin motion-reduce:animate-none")} />
          Try again
        </Button>
      </div>
    );
  }

  const { enquiries, applications, services, pages, activity } = data;
  const hasPipeline = !!enquiries || !!applications;
  const hasAnySection = hasPipeline || !!services || !!pages;
  const insightCards = [enquiries, applications, services, pages].filter(Boolean).length;

  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {formatDay(data.generatedAt, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-foreground">
              {greeting(data.generatedAt)}
              {user?.username ? `, ${user.username}` : ""}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{summaryLine(data)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
              <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin motion-reduce:animate-none")} />
              Refresh
            </Button>
            {services && (
              <Button size="sm" asChild>
                <Link href="/dashboard/services/create-service">
                  <Plus className="mr-1.5 size-3.5" />
                  Add service
                </Link>
              </Button>
            )}
          </div>
        </header>

        {failed && (
          <p role="status" className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[13px] text-warning">
            Couldn&apos;t refresh just now. Showing the last figures loaded.
          </p>
        )}

        {!hasAnySection && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Your role doesn&apos;t include any dashboard sections yet. Ask an administrator for access.
            </CardContent>
          </Card>
        )}

        {hasAnySection && <AttentionPanel data={data} />}

        {activity && hasPipeline && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <ActivityCard
              className="xl:col-span-2"
              days={activity}
              showEnquiries={!!enquiries}
              showApplications={!!applications}
            />
            <PipelineCard data={data} />
          </div>
        )}

        {hasPipeline && (
          <div className={cn("grid grid-cols-1 gap-5", enquiries && applications && "lg:grid-cols-2")}>
            {enquiries && (
              <PeopleCard
                title="Latest enquiries"
                description="Clients asking for a crew"
                href="/dashboard/leads"
                emptyText="No enquiries yet"
              >
                {enquiries.recent.map((lead) => (
                  <PersonRow
                    key={lead.id}
                    person={lead}
                    now={data.generatedAt}
                    href="/dashboard/leads"
                    statusLabel={ENQUIRY_LABELS[lead.status]}
                    detail={[lead.need, lead.crew && plural(Number(lead.crew), "worker"), lead.location].filter(Boolean).join(" · ")}
                  />
                ))}
              </PeopleCard>
            )}
            {applications && (
              <PeopleCard
                title="Latest applications"
                description="Workers asking to join the crew"
                href="/dashboard/applications"
                emptyText="No applications yet"
              >
                {applications.recent.map((worker) => (
                  <PersonRow
                    key={worker.id}
                    person={worker}
                    now={data.generatedAt}
                    href="/dashboard/applications"
                    statusLabel={APPLICATION_LABELS[worker.status]}
                    detail={[worker.trade, worker.experience, worker.location].filter(Boolean).join(" · ")}
                    whatsapp
                  />
                ))}
              </PeopleCard>
            )}
          </div>
        )}

        {insightCards > 0 && (
          <div
            className={cn(
              "grid grid-cols-1 gap-5 md:grid-cols-2",
              insightCards === 3 && "xl:grid-cols-3",
              insightCards === 4 && "xl:grid-cols-4",
            )}
          >
            {applications && (
              <RankedCard
                title="Trades applying"
                description="Applications, last 30 days"
                rows={applications.trades}
                emptyText="No applications in the last 30 days"
              />
            )}
            {enquiries && (
              <RankedCard
                title="Where enquiries come from"
                description="All enquiries, by website form"
                rows={enquiries.sources}
                emptyText="No enquiries yet"
              />
            )}
            {services && <ServicesCard services={services} now={data.generatedAt} />}
            {pages && <PagesCard pages={pages} now={data.generatedAt} />}
          </div>
        )}
      </div>
    </div>
  );
}

function AttentionPanel({ data }: { data: DashboardData }) {
  const { enquiries, applications, services } = data;
  const items: Array<{
    label: string;
    count: number;
    detail: string;
    clear: string;
    action: string;
    href: string;
    icon: LucideIcon;
  }> = [];

  if (enquiries) {
    items.push({
      label: "New enquiries",
      count: enquiries.byStatus.new,
      detail: enquiries.oldestNewAt ? waitingFor(enquiries.oldestNewAt, data.generatedAt) : "",
      clear: "Every enquiry has had a reply",
      action: "Review enquiries",
      href: "/dashboard/leads",
      icon: Inbox,
    });
  }
  if (applications) {
    items.push({
      label: "New applications",
      count: applications.byStatus.new,
      detail: applications.oldestNewAt ? waitingFor(applications.oldestNewAt, data.generatedAt) : "",
      clear: "Every applicant has had a reply",
      action: "Review applications",
      href: "/dashboard/applications",
      icon: ClipboardList,
    });
  }
  if (services) {
    items.push({
      label: "Draft services",
      count: services.draft,
      detail: "Not live on the website yet",
      clear: "All services are live",
      action: "Finish drafts",
      href: "/dashboard/services",
      icon: FilePen,
    });
  }

  if (items.length === 0) return null;

  return (
    <section aria-label="Needs your attention">
      <h2 className="mb-2 text-[13px] font-medium text-muted-foreground">Needs your attention</h2>
      <div
        className={cn(
          "grid grid-cols-1 divide-y overflow-hidden rounded-lg border bg-card sm:divide-x sm:divide-y-0",
          items.length === 2 && "sm:grid-cols-2",
          items.length === 3 && "sm:grid-cols-3",
        )}
      >
        {items.map(({ label, count, detail, clear, action, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col gap-3 p-5 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-hidden"
          >
            <span className="flex items-center gap-2 text-[13px] font-medium text-foreground-light">
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </span>
            <span className="text-4xl leading-none font-semibold tracking-tight text-foreground tabular-nums">{count}</span>
            {count > 0 ? (
              <span className="flex flex-1 flex-col justify-between gap-3">
                <span className="text-[13px] text-muted-foreground">{detail}</span>
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-link">
                  {action}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Check className="size-3.5 text-success" />
                {clear}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityCard({
  days,
  showEnquiries,
  showApplications,
  className,
}: {
  days: ActivityDay[];
  showEnquiries: boolean;
  showApplications: boolean;
  className?: string;
}) {
  const totalFor = (day: ActivityDay) => (showEnquiries ? day.enquiries : 0) + (showApplications ? day.applications : 0);
  const sum = (rows: ActivityDay[], pick: (day: ActivityDay) => number) => rows.reduce((acc, day) => acc + pick(day), 0);

  const thisWeek = sum(days.slice(-7), totalFor);
  const lastWeek = sum(days.slice(-14, -7), totalFor);
  const change = thisWeek - lastWeek;
  const changeText =
    change === 0 ? "same as last week" : `${Math.abs(change)} ${change > 0 ? "more" : "fewer"} than last week`;

  // Top of the scale divides by 4 so the axis labels are always whole numbers.
  const peak = Math.max(...days.map(totalFor), 0);
  const top = Math.max(4, Math.ceil(peak / 4) * 4);
  const ticks = [top, top / 2, 0];
  const bothSeries = showEnquiries && showApplications;
  const noun = bothSeries ? "Enquiries and applications" : showEnquiries ? "Enquiries" : "Applications";

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{noun} received</CardTitle>
        <CardDescription>
          <span className="font-medium text-foreground tabular-nums">{thisWeek}</span> in the last 7 days, {changeText}
        </CardDescription>
        {bothSeries && (
          <CardAction className="flex items-center gap-3 text-xs text-muted-foreground">
            <LegendKey className="bg-brand-link" label="Enquiries" />
            <LegendKey className="bg-chart-2" label="Applications" />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {peak === 0 ? (
          <p className="flex h-44 items-center justify-center text-sm text-muted-foreground">
            Nothing received in the last 30 days
          </p>
        ) : (
          <>
            <div className="relative h-44" aria-hidden="true">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-border"
                  style={{ bottom: `${(tick / top) * 100}%` }}
                >
                  <span className="absolute -top-2 left-0 bg-card pr-1.5 text-[11px] leading-4 text-muted-foreground tabular-nums">
                    {tick}
                  </span>
                </div>
              ))}
              <div className="absolute inset-y-0 right-0 left-7 flex items-end gap-px sm:gap-1">
                {days.map((day, index) => {
                  const enquiries = showEnquiries ? day.enquiries : 0;
                  const applications = showApplications ? day.applications : 0;
                  return (
                    <div
                      key={day.date}
                      tabIndex={-1}
                      className="group relative flex h-full min-w-0 flex-1 flex-col-reverse items-center gap-0.5 rounded-sm outline-hidden hover:bg-muted/70 focus:bg-muted/70"
                    >
                      {enquiries > 0 && (
                        <span
                          className={cn("block w-full max-w-3.5 shrink-0 bg-brand-link", applications === 0 && "rounded-t-[3px]")}
                          style={{ height: `${(enquiries / top) * 100}%` }}
                        />
                      )}
                      {applications > 0 && (
                        <span
                          className="block w-full max-w-3.5 shrink-0 rounded-t-[3px] bg-chart-2"
                          style={{ height: `${(applications / top) * 100}%` }}
                        />
                      )}
                      <span
                        className={cn(
                          "pointer-events-none absolute top-1 z-10 hidden w-max rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md group-hover:block group-focus:block",
                          index < days.length / 2 ? "left-full ml-1" : "right-full mr-1",
                        )}
                      >
                        <span className="block font-medium">{formatDay(day.date)}</span>
                        {showEnquiries && <TooltipRow className="bg-brand-link" label="Enquiries" value={day.enquiries} />}
                        {showApplications && <TooltipRow className="bg-chart-2" label="Applications" value={day.applications} />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex justify-between pl-7 text-[11px] text-muted-foreground" aria-hidden="true">
              <span>{formatDay(days[0].date)}</span>
              <span>{formatDay(days[Math.floor(days.length / 2)].date)}</span>
              <span>Today</span>
            </div>
            <table className="sr-only">
              <caption>{noun} received per day, last 30 days</caption>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  {showEnquiries && <th scope="col">Enquiries</th>}
                  {showApplications && <th scope="col">Applications</th>}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.date}>
                    <th scope="row">{formatDay(day.date)}</th>
                    {showEnquiries && <td>{day.enquiries}</td>}
                    {showApplications && <td>{day.applications}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LegendKey({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-[2px]", className)} />
      {label}
    </span>
  );
}

function TooltipRow({ className, label, value }: { className: string; label: string; value: number }) {
  return (
    <span className="mt-1 flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-[2px]", className)} />
      {label}
      <span className="ml-auto pl-3 font-medium text-popover-foreground tabular-nums">{value}</span>
    </span>
  );
}

function PipelineCard({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline</CardTitle>
        <CardDescription>Where everyone stands right now</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.enquiries && (
          <PipelineGroup
            title="Enquiries"
            outcome="became clients"
            counts={data.enquiries.byStatus}
            total={data.enquiries.total}
            labels={ENQUIRY_LABELS}
          />
        )}
        {data.applications && (
          <PipelineGroup
            title="Applications"
            outcome="were hired"
            counts={data.applications.byStatus}
            total={data.applications.total}
            labels={APPLICATION_LABELS}
          />
        )}
      </CardContent>
    </Card>
  );
}

function PipelineGroup({
  title,
  outcome,
  counts,
  total,
  labels,
}: {
  title: string;
  outcome: string;
  counts: StatusCounts;
  total: number;
  labels: Record<Status, string>;
}) {
  const rate = total > 0 ? Math.round((counts.converted / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-medium text-foreground">
          {title} <span className="font-normal text-muted-foreground tabular-nums">{total}</span>
        </h3>
        <p className="text-xs text-muted-foreground tabular-nums">
          {rate}% {outcome}
        </p>
      </div>
      <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
        {STATUS_ORDER.filter((status) => counts[status] > 0).map((status) => (
          <span key={status} className={STATUS_FILL[status]} style={{ flexGrow: counts[status], flexBasis: 0 }} />
        ))}
      </div>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={cn("size-2 shrink-0 rounded-[2px]", STATUS_FILL[status])} />
            <dt className="text-muted-foreground">{labels[status]}</dt>
            <dd className="ml-auto font-medium text-foreground tabular-nums">{counts[status]}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PeopleCard({
  title,
  description,
  href,
  emptyText,
  children,
}: {
  title: string;
  description: string;
  href: string;
  emptyText: string;
  children: ReactNode[];
}) {
  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground">
            <Link href={href}>
              View all <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      {children.length > 0 ? (
        <ul className="divide-y">{children}</ul>
      ) : (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">{emptyText}</p>
      )}
    </Card>
  );
}

function PersonRow({
  person,
  now,
  href,
  statusLabel,
  detail,
  whatsapp = false,
}: {
  person: Person;
  now: string;
  href: string;
  statusLabel: string;
  detail: string;
  whatsapp?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 pr-3 transition-colors hover:bg-muted/50">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">{person.name}</span>
            <Badge variant={STATUS_BADGE[person.status]}>{statusLabel}</Badge>
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{detail || "No details given"}</span>
        </span>
        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{timeAgo(person.createdAt, now)}</span>
      </Link>
      <span className="flex shrink-0 items-center">
        <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground">
          <a href={`tel:${person.phoneNo}`} aria-label={`Call ${person.name}`}>
            <Phone className="size-3.5" />
          </a>
        </Button>
        {whatsapp && (
          <Button variant="ghost" size="icon" asChild className="size-8 text-muted-foreground">
            <a href={whatsappLink(person.phoneNo)} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp ${person.name}`}>
              <MessageCircle className="size-3.5" />
            </a>
          </Button>
        )}
      </span>
    </li>
  );
}

function RankedCard({
  title,
  description,
  rows,
  emptyText,
}: {
  title: string;
  description: string;
  rows: RankedRow[];
  emptyText: string;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.label}>
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="min-w-0 truncate text-foreground-light" title={row.label}>
                    {row.label}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{row.count}</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand-link" style={{ width: `${(row.count / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ServicesCard({ services, now }: { services: NonNullable<DashboardData["services"]>; now: string }) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription className="tabular-nums">
          {services.published} live, {services.draft} in draft
        </CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-muted-foreground">
            <Link href="/dashboard/services" aria-label="View all services">
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      {services.recent.length > 0 ? (
        <ul className="px-2">
          {services.recent.map((service) => (
            <li key={service.id}>
              <Link
                href={`/dashboard/services/${service.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-hidden"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-foreground">{service.title || service.slug}</span>
                  <span className="block text-xs text-muted-foreground">Edited {timeAgo(service.updatedAt, now).toLowerCase()}</span>
                </span>
                <Badge variant={service.status === "published" ? "success" : "secondary"}>
                  {service.status === "published" ? "Live" : "Draft"}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <CardContent>
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/services/create-service">
              <Plus className="mr-1.5 size-3.5" /> Create your first service
            </Link>
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

function PagesCard({ pages, now }: { pages: NonNullable<DashboardData["pages"]>; now: string }) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle>Website pages</CardTitle>
        <CardDescription>When each page was last edited</CardDescription>
      </CardHeader>
      <ul className="px-2">
        {pages.map((page) => (
          <li key={page.href}>
            <Link
              href={page.href}
              className="flex items-baseline justify-between gap-3 rounded-md px-3 py-2 transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-hidden"
            >
              <span className="min-w-0 truncate text-[13px] font-medium text-foreground">{page.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {page.updatedAt ? timeAgo(page.updatedAt, now) : "Not edited yet"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function DashboardSkeleton() {
  const block = "animate-pulse rounded-lg bg-muted motion-reduce:animate-none";
  return (
    <div className="min-h-screen w-full bg-background px-4 py-6 sm:px-6 lg:px-8" role="status" aria-label="Loading dashboard">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="space-y-2">
          <div className={cn(block, "h-3 w-40")} />
          <div className={cn(block, "h-7 w-64")} />
          <div className={cn(block, "h-4 w-72")} />
        </div>
        <div className={cn(block, "h-40")} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className={cn(block, "h-72 xl:col-span-2")} />
          <div className={cn(block, "h-72")} />
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className={cn(block, "h-80")} />
          <div className={cn(block, "h-80")} />
        </div>
      </div>
    </div>
  );
}
