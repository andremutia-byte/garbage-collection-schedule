"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  ExternalLink,
  Layers,
  ListChecks,
  MapPin,
  Plus,
  Recycle,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import type { AdminStats, CollectionActivityItem } from "@/app/actions/admin";

interface AdminDashboardClientProps {
  stats: AdminStats;
}

function formatPickupDate(iso: string) {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getRelativeDateLabel(iso: string, status: string) {
  if (status === "completed") return { text: "Completed", variant: "completed" as const };
  if (status === "missed") return { text: "Missed", variant: "missed" as const };
  if (status === "skipped") return { text: "Skipped", variant: "skipped" as const };

  const todayStr = new Date().toISOString().slice(0, 10);
  if (iso === todayStr) return { text: "Today", variant: "today" as const };

  const today = new Date(todayStr + "T00:00:00Z");
  const target = new Date(iso + "T00:00:00Z");
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return { text: "Tomorrow", variant: "upcoming" as const };
  if (diffDays > 1) return { text: `In ${diffDays} days`, variant: "upcoming" as const };
  if (diffDays === -1) return { text: "Yesterday", variant: "overdue" as const };
  if (diffDays < -1) return { text: `${Math.abs(diffDays)}d ago`, variant: "overdue" as const };
  return { text: "Scheduled", variant: "upcoming" as const };
}

function StatusBadge({ status }: { status: "scheduled" | "completed" | "missed" | "skipped" }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
          Completed
        </span>
      );
    case "scheduled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3 shrink-0 text-amber-600" />
          Scheduled
        </span>
      );
    case "missed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
          Missed
        </span>
      );
    case "skipped":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <XCircle className="h-3 w-3 shrink-0 text-slate-500" />
          Skipped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
}

export function AdminDashboardClient({ stats }: { stats: AdminStats }) {
  const [activityFilter, setActivityFilter] = useState<"all" | "scheduled" | "completed" | "missed_skipped">("all");
  const [activitySearch, setActivitySearch] = useState("");

  // Accurate activity counts computed directly from loaded items
  const activityCounts = useMemo(() => {
    return {
      all: stats.recentPickups.length,
      scheduled: stats.recentPickups.filter((p) => p.status === "scheduled").length,
      completed: stats.recentPickups.filter((p) => p.status === "completed").length,
      missed_skipped: stats.recentPickups.filter((p) => p.status === "missed" || p.status === "skipped").length,
    };
  }, [stats.recentPickups]);

  // Filter collection activity by status & text query
  const filteredActivity = useMemo(() => {
    return stats.recentPickups.filter((pickup) => {
      // Status filter
      if (activityFilter === "scheduled" && pickup.status !== "scheduled") return false;
      if (activityFilter === "completed" && pickup.status !== "completed") return false;
      if (activityFilter === "missed_skipped" && pickup.status !== "missed" && pickup.status !== "skipped") return false;

      // Text search
      if (activitySearch.trim()) {
        const query = activitySearch.toLowerCase();
        const addressMatch = `${pickup.address.street} ${pickup.address.unit ?? ""} ${pickup.address.city} ${pickup.address.postal_code} ${pickup.address.barangay_name ?? ""}`
          .toLowerCase()
          .includes(query);
        const residentMatch = (pickup.resident_email ?? "").toLowerCase().includes(query);
        const categoryMatch = pickup.waste_category.name.toLowerCase().includes(query);
        const dateMatch = pickup.scheduled_date.includes(query);

        return addressMatch || residentMatch || categoryMatch || dateMatch;
      }

      return true;
    });
  }, [stats.recentPickups, activityFilter, activitySearch]);

  const completionRate = stats.totalPickups > 0
    ? Math.round((stats.completedPickups / stats.totalPickups) * 100)
    : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ─── Page Title Header with Quick Action Shortcuts ────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Supabase Records
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">
            Operational analytics and garbage collection management for Butuan City.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/schedules"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <CalendarClock className="h-4 w-4" />
            Manage Schedules
          </Link>
          <Link
            href="/admin/residents"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Users className="h-4 w-4 text-blue-600" />
            View Residents
          </Link>
          <Link
            href="/admin/addresses"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Building2 className="h-4 w-4 text-violet-600" />
            Manage Addresses
          </Link>
        </div>
      </div>

      {/* ─── 1. Overview Cards (4 Clear Summary Cards) ──────────────────── */}
      <section aria-labelledby="overview-cards-heading">
        <h2 id="overview-cards-heading" className="sr-only">Overview Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Residents */}
          <Link
            href="/admin/residents"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Residents
                </p>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                  {stats.totalResidents.toLocaleString()}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-3 border-t border-slate-100 mt-3 font-medium">
              <span>Active user accounts</span>
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600 ml-auto" />
            </p>
          </Link>

          {/* Card 2: Registered Addresses */}
          <Link
            href="/admin/addresses"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Registered Addresses
                </p>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-1">
                  {stats.totalAddresses.toLocaleString()}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-3 border-t border-slate-100 mt-3 font-medium">
              <span>Service locations in Butuan</span>
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-600 ml-auto" />
            </p>
          </Link>

          {/* Card 3: Active Schedules */}
          <Link
            href="/admin/schedules"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Active Schedules
                </p>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 mt-1">
                  {stats.activeSchedules.toLocaleString()}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CalendarClock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-3 border-t border-slate-100 mt-3 font-medium">
              <span>Recurring collection rules</span>
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600 ml-auto" />
            </p>
          </Link>

          {/* Card 4: Upcoming Pickups */}
          <Link
            href="/admin/schedules?tab=pickups"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Upcoming Pickups
                </p>
                <p className="text-2xl sm:text-3xl font-black tracking-tight text-amber-600 mt-1">
                  {stats.upcomingPickups.toLocaleString()}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-3 border-t border-slate-100 mt-3 font-medium">
              <span>Today & upcoming dates</span>
              <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600 ml-auto" />
            </p>
          </Link>
        </div>
      </section>

      {/* ─── Quick Actions Section ────────────────────────────────────────── */}
      <section aria-labelledby="quick-actions-heading" className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 id="quick-actions-heading" className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-emerald-600" />
              Quick Actions
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Working shortcuts to create schedules, manage residents, and view collection pickups.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/admin/schedules?action=new"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-xs transition group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition flex items-center gap-1">
                <span>Add Schedule</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-emerald-600" />
              </p>
              <p className="text-[11px] text-slate-500 truncate">Create collection rule</p>
            </div>
          </Link>

          <Link
            href="/admin/residents"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40 hover:bg-blue-50 hover:border-blue-300 hover:shadow-xs transition group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-800 transition flex items-center gap-1">
                <span>Manage Residents</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-blue-600" />
              </p>
              <p className="text-[11px] text-slate-500 truncate">Users, roles & contacts</p>
            </div>
          </Link>

          <Link
            href="/admin/schedules?tab=pickups"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs transition group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <ListChecks className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-amber-800 transition flex items-center gap-1">
                <span>View Pickups</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-amber-600" />
              </p>
              <p className="text-[11px] text-slate-500 truncate">Browse & update pickups</p>
            </div>
          </Link>

          <Link
            href="/admin/addresses"
            className="flex items-center gap-3 p-3.5 rounded-xl border border-violet-200/80 bg-violet-50/40 hover:bg-violet-50 hover:border-violet-300 hover:shadow-xs transition group"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-violet-800 transition flex items-center gap-1">
                <span>Manage Addresses</span>
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition text-violet-600" />
              </p>
              <p className="text-[11px] text-slate-500 truncate">Service addresses in Butuan</p>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── 2. Collection Activity (Moved Directly Below Overview Cards) ─── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Section Header & Filter Toolbar */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-emerald-600" />
                Collection Activity
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Live and recent pickup records with resident, barangay, and category details.
              </p>
            </div>
            <Link
              href="/admin/schedules"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition self-start sm:self-auto bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200"
            >
              Manage in Schedules
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivityFilter("all")}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  activityFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All ({activityCounts.all})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter("scheduled")}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  activityFilter === "scheduled"
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Upcoming ({activityCounts.scheduled})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter("completed")}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  activityFilter === "completed"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Completed ({activityCounts.completed})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter("missed_skipped")}
                className={`px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                  activityFilter === "missed_skipped"
                    ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Missed / Skipped ({activityCounts.missed_skipped})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs ml-auto">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search address, barangay, resident…"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Dedicated Vertical Scrollable Pickup Records Container */}
        <div
          id="collection-activity-scroll-container"
          className="max-h-[440px] overflow-y-auto overflow-x-hidden custom-scrollbar"
          style={{ overscrollBehaviorY: "contain" }}
        >
          {filteredActivity.length === 0 ? (
            <div className="text-center py-12 px-4">
              <CalendarClock className="h-10 w-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No collection activity found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activitySearch
                  ? `No pickups match "${activitySearch}". Try clearing your search query.`
                  : "No pickups match the selected status filter."}
              </p>
              {(activitySearch || activityFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setActivitySearch("");
                    setActivityFilter("all");
                  }}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-xs border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px] shadow-2xs">
                    <tr>
                      <th className="px-5 lg:px-6 py-3.5 bg-slate-50">Scheduled Date</th>
                      <th className="px-5 lg:px-6 py-3.5 bg-slate-50">Resident & Address</th>
                      <th className="px-5 lg:px-6 py-3.5 bg-slate-50">Waste Category</th>
                      <th className="px-5 lg:px-6 py-3.5 bg-slate-50">Status</th>
                      <th className="px-5 lg:px-6 py-3.5 text-right bg-slate-50">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredActivity.map((pickup) => {
                      const relative = getRelativeDateLabel(pickup.scheduled_date, pickup.status);
                      return (
                        <tr key={pickup.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Date Column */}
                          <td className="px-5 lg:px-6 py-3.5 whitespace-nowrap">
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {formatPickupDate(pickup.scheduled_date)}
                            </p>
                            <span
                              className={`inline-block mt-0.5 text-[11px] font-medium ${
                                relative.variant === "completed"
                                  ? "text-emerald-600"
                                  : relative.variant === "today"
                                  ? "text-amber-600 font-semibold"
                                  : relative.variant === "overdue"
                                  ? "text-rose-600"
                                  : "text-slate-500"
                              }`}
                            >
                              {relative.text}
                            </span>
                          </td>

                          {/* Resident & Address Column */}
                          <td className="px-5 lg:px-6 py-3.5">
                            <div className="space-y-0.5">
                              <p className="font-semibold text-slate-900 text-xs sm:text-sm">
                                {pickup.address.street}
                                {pickup.address.unit ? `, ${pickup.address.unit}` : ""}
                              </p>
                              <p className="text-slate-500 text-[11px] flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                <span>
                                  {pickup.address.barangay_name
                                    ? `Barangay ${pickup.address.barangay_name}, `
                                    : ""}
                                  {pickup.address.city} {pickup.address.postal_code}
                                </span>
                              </p>
                              {pickup.resident_email ? (
                                <p className="text-emerald-700 text-[11px] flex items-center gap-1 font-mono">
                                  <Users className="h-3 w-3 shrink-0" />
                                  {pickup.resident_email}
                                </p>
                              ) : (
                                <p className="text-slate-400 text-[11px] italic">No resident registered</p>
                              )}
                            </div>
                          </td>

                          {/* Waste Category Column */}
                          <td className="px-5 lg:px-6 py-3.5 whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-slate-50 border border-slate-200">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10"
                                style={{ backgroundColor: pickup.waste_category.color_code || "#64748b" }}
                              />
                              <span className="font-medium text-slate-800">{pickup.waste_category.name}</span>
                            </div>
                          </td>

                          {/* Status Column */}
                          <td className="px-5 lg:px-6 py-3.5 whitespace-nowrap">
                            <StatusBadge status={pickup.status} />
                          </td>

                          {/* Notes Column */}
                          <td className="px-5 lg:px-6 py-3.5 text-right text-slate-500 max-w-xs truncate">
                            {pickup.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredActivity.map((pickup) => {
                  const relative = getRelativeDateLabel(pickup.scheduled_date, pickup.status);
                  return (
                    <div key={pickup.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{formatPickupDate(pickup.scheduled_date)}</p>
                          <p className="text-xs text-slate-500">{relative.text}</p>
                        </div>
                        <StatusBadge status={pickup.status} />
                      </div>

                      <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="font-semibold text-slate-900">
                          {pickup.address.street}
                          {pickup.address.unit ? `, ${pickup.address.unit}` : ""}
                        </p>
                        <p className="text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>
                            {pickup.address.barangay_name
                              ? `Barangay ${pickup.address.barangay_name}, `
                              : ""}
                            {pickup.address.city} {pickup.address.postal_code}
                          </span>
                        </p>
                        {pickup.resident_email && (
                          <p className="text-emerald-700 flex items-center gap-1 pt-0.5 font-mono">
                            <Users className="h-3 w-3 shrink-0" />
                            {pickup.resident_email}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs bg-slate-50 border border-slate-200">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: pickup.waste_category.color_code || "#64748b" }}
                          />
                          <span className="font-medium text-slate-800">{pickup.waste_category.name}</span>
                        </div>
                        {pickup.notes && (
                          <span className="text-[11px] text-slate-400 italic truncate max-w-[150px]">
                            {pickup.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer info bar showing record count */}
        {filteredActivity.length > 0 && (
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>
              Showing {filteredActivity.length} of {stats.recentPickups.length} {stats.recentPickups.length === 1 ? "record" : "records"}
              {activitySearch ? ` matching "${activitySearch}"` : ""}
            </span>
            <span className="text-slate-400 hidden sm:inline">Scroll to view all activity</span>
          </div>
        )}
      </section>

      {/* ─── 3. Statistics & Reports (Compact, Streamlined View) ─────────── */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Statistics & Reports
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                {stats.totalPickups.toLocaleString()} Total Pickups Logged
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete breakdown of all {stats.totalPickups} pickup records in the database ({stats.upcomingPickups} scheduled upcoming from today, {stats.completedPickups} completed, {stats.missedSkippedPickups} missed/skipped).
            </p>
          </div>

          <Link
            href="/admin/schedules"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Configure Schedules</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {stats.totalPickups === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <CalendarClock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No Collection Pickups Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no pickups generated in the database.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Multi-Segment Distribution Bar */}
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Status Distribution</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {stats.upcomingPickups} upcoming · {stats.completedPickups} completed
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-200/80 rounded-full overflow-hidden flex">
                {stats.byStatus.map((item) => {
                  if (item.count === 0) return null;
                  const bgClass =
                    item.status === "completed"
                      ? "bg-emerald-500"
                      : item.status === "scheduled"
                      ? "bg-amber-500"
                      : item.status === "missed"
                      ? "bg-rose-500"
                      : "bg-slate-400";
                  return (
                    <div
                      key={item.status}
                      style={{ width: `${(item.count / stats.totalPickups) * 100}%` }}
                      title={`${item.label}: ${item.count} (${item.percentage}%)`}
                      className={`${bgClass} transition-all duration-300 first:rounded-l-full last:rounded-r-full hover:brightness-110`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Compact 2-Column Side-by-Side Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Report 1: Pickups Grouped by Status */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Status Breakdown
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">4 Status Categories</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {stats.byStatus.map((item) => (
                    <div
                      key={item.status}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-xs text-slate-900">{item.count.toLocaleString()}</span>
                        <span className="text-[11px] text-slate-400 ml-1 font-semibold">({item.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report 2: Pickups Grouped by Waste Category */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Recycle className="h-3.5 w-3.5 text-slate-500" />
                    Waste Category Breakdown
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">{stats.byCategory.length} Waste Types</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {stats.byCategory.map((cat) => {
                    const color = cat.color_code || "#64748b";
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-xs text-slate-800 truncate">{cat.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-extrabold text-xs text-slate-900">{cat.count.toLocaleString()}</span>
                          <span className="text-[11px] text-slate-400 ml-1 font-semibold">({cat.percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
