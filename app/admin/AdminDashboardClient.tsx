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
  MapPin,
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
  if (diffDays < -1) return { text: `${Math.abs(diffDays)}d overdue`, variant: "overdue" as const };
  return { text: "Scheduled", variant: "upcoming" as const };
}

function StatusBadge({ status }: { status: "scheduled" | "completed" | "missed" | "skipped" }) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
          Completed
        </span>
      );
    case "scheduled":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-3 w-3 shrink-0 text-amber-600" />
          Scheduled
        </span>
      );
    case "missed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
          <AlertTriangle className="h-3 w-3 shrink-0 text-rose-600" />
          Missed
        </span>
      );
    case "skipped":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
          <XCircle className="h-3 w-3 shrink-0 text-slate-500" />
          Skipped
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          {status}
        </span>
      );
  }
}

export function AdminDashboardClient({ stats }: { stats: AdminStats }) {
  const [reportTab, setReportTab] = useState<"all" | "status" | "category">("all");
  const [activityFilter, setActivityFilter] = useState<"all" | "scheduled" | "completed" | "missed_skipped">("all");
  const [activitySearch, setActivitySearch] = useState("");

  // Filter collection activity
  const filteredActivity = useMemo(() => {
    return stats.recentPickups.filter((pickup) => {
      // Status filter
      if (activityFilter === "scheduled" && pickup.status !== "scheduled") return false;
      if (activityFilter === "completed" && pickup.status !== "completed") return false;
      if (activityFilter === "missed_skipped" && pickup.status !== "missed" && pickup.status !== "skipped") return false;

      // Text search
      if (activitySearch.trim()) {
        const query = activitySearch.toLowerCase();
        const addressMatch = `${pickup.address.street} ${pickup.address.unit ?? ""} ${pickup.address.city} ${pickup.address.postal_code}`
          .toLowerCase()
          .includes(query);
        const residentMatch = (pickup.resident_email ?? "").toLowerCase().includes(query);
        const categoryMatch = pickup.waste_category.name.toLowerCase().includes(query);
        const zoneMatch = (pickup.zone_name ?? "").toLowerCase().includes(query);
        const dateMatch = pickup.scheduled_date.includes(query);

        return addressMatch || residentMatch || categoryMatch || zoneMatch || dateMatch;
      }

      return true;
    });
  }, [stats.recentPickups, activityFilter, activitySearch]);

  const completionRate = stats.totalPickups > 0
    ? Math.round((stats.completedPickups / stats.totalPickups) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* ─── Page Title Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Supabase Records
            </span>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            System overview and operational analytics for garbage collection management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/schedules"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <CalendarClock className="h-4 w-4" />
            Manage Schedules
          </Link>
        </div>
      </div>

      {/* ─── Summary Cards (6 Cards) ──────────────────────────────────────── */}
      <section aria-labelledby="summary-cards-heading">
        <h2 id="summary-cards-heading" className="sr-only">Summary Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Total Residents */}
          <Link
            href="/admin/residents"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Residents</p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalResidents.toLocaleString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-medium">
                Active user accounts
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-600" />
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 2: Registered Addresses */}
          <Link
            href="/admin/addresses"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-violet-300 hover:shadow-xs transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Addresses</p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalAddresses.toLocaleString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-medium">
                Assigned service locations
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-violet-600" />
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 border border-violet-100 group-hover:bg-violet-600 group-hover:text-white transition-colors">
              <Building2 className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 3: Collection Zones */}
          <Link
            href="/admin/zones"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Zones</p>
              <p className="text-3xl font-extrabold tracking-tight text-slate-900">{stats.totalZones.toLocaleString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-medium">
                Active collection sectors
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <MapPin className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 4: Upcoming Pickups */}
          <Link
            href="/admin/schedules"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Upcoming Pickups</p>
              <p className="text-3xl font-extrabold tracking-tight text-amber-600">{stats.upcomingPickups.toLocaleString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-medium">
                Scheduled for collection
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-600" />
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CalendarCheck className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 5: Completed Pickups */}
          <Link
            href="/admin/schedules"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Pickups</p>
              <p className="text-3xl font-extrabold tracking-tight text-emerald-600">{stats.completedPickups.toLocaleString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-medium">
                {completionRate}% overall completion rate
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </Link>

          {/* Card 6: Missed/Skipped Pickups */}
          <Link
            href="/admin/schedules"
            className="group bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Missed / Skipped</p>
              <p className="text-3xl font-extrabold tracking-tight text-rose-600">{stats.missedSkippedPickups.toLocaleString()}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1 pt-1 font-medium">
                {stats.missedPickups} missed · {stats.skippedPickups} skipped
                <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-rose-600" />
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Reports & Statistics Section ─────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Statistics & Reports
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of total pickups ({stats.totalPickups.toLocaleString()} total) grouped by collection status and waste category.
            </p>
          </div>

          {/* View toggle pills */}
          <div className="flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium">
            <button
              onClick={() => setReportTab("all")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                reportTab === "all" ? "bg-white text-slate-900 font-semibold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setReportTab("status")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                reportTab === "status" ? "bg-white text-slate-900 font-semibold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By Status
            </button>
            <button
              onClick={() => setReportTab("category")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                reportTab === "category" ? "bg-white text-slate-900 font-semibold shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              By Category
            </button>
          </div>
        </div>

        {stats.totalPickups === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <CalendarClock className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Collection Pickups Recorded</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              There are currently no pickups generated in the database. Create recurring schedules and generate pickups to view live reports.
            </p>
            <Link
              href="/admin/schedules"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              Go to Schedules
            </Link>
          </div>
        ) : (
          <>
            {/* Visual Multi-Segment Distribution Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-700">Overall Collection Status Distribution</span>
                <span>{stats.totalPickups} Total Pickups</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
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

              {/* Status Segment Legend */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                {stats.byStatus.map((item) => {
                  const dotClass =
                    item.status === "completed"
                      ? "bg-emerald-500"
                      : item.status === "scheduled"
                      ? "bg-amber-500"
                      : item.status === "missed"
                      ? "bg-rose-500"
                      : "bg-slate-400";
                  return (
                    <div key={item.status} className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
                      <span className="font-medium">{item.label}:</span>
                      <span className="text-slate-500">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Cards Grid */}
            <div className={`grid gap-6 ${reportTab === "all" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
              {/* Report 1: Pickups Grouped by Status */}
              {(reportTab === "all" || reportTab === "status") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      Pickups by Status
                    </h3>
                    <span className="text-xs text-slate-500">4 Categories</span>
                  </div>

                  <div className="space-y-3">
                    {stats.byStatus.map((item) => {
                      const barClass =
                        item.status === "completed"
                          ? "bg-emerald-500"
                          : item.status === "scheduled"
                          ? "bg-amber-500"
                          : item.status === "missed"
                          ? "bg-rose-500"
                          : "bg-slate-400";

                      return (
                        <div key={item.status} className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-slate-900">{item.count.toLocaleString()}</span>
                              <span className="text-slate-400 ml-1.5">({item.percentage}%)</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Report 2: Pickups Grouped by Waste Category */}
              {(reportTab === "all" || reportTab === "category") && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <Recycle className="h-4 w-4 text-slate-500" />
                      Pickups by Waste Category
                    </h3>
                    <span className="text-xs text-slate-500">{stats.byCategory.length} Categories</span>
                  </div>

                  <div className="space-y-3">
                    {stats.byCategory.map((cat) => {
                      const color = cat.color_code || "#64748b";
                      return (
                        <div key={cat.id} className="bg-white rounded-lg border border-slate-200 p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full shrink-0 border border-black/10"
                                style={{ backgroundColor: color }}
                              />
                              <span className="font-medium text-slate-900">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold text-slate-900">{cat.count.toLocaleString()}</span>
                              <span className="text-slate-400 ml-1.5">({cat.percentage}%)</span>
                            </div>
                          </div>
                          {/* Progress bar */}
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${cat.percentage}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {/* ─── Collection Activity Section ─────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-emerald-600" />
                Collection Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recent and upcoming pickups with live resident, category, and zone records.
              </p>
            </div>
            <Link
              href="/admin/schedules"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition self-start sm:self-auto"
            >
              View all in Schedules
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
              <button
                onClick={() => setActivityFilter("all")}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  activityFilter === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All ({stats.recentPickups.length})
              </button>
              <button
                onClick={() => setActivityFilter("scheduled")}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  activityFilter === "scheduled"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Upcoming ({stats.upcomingPickups})
              </button>
              <button
                onClick={() => setActivityFilter("completed")}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  activityFilter === "completed"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Completed ({stats.completedPickups})
              </button>
              <button
                onClick={() => setActivityFilter("missed_skipped")}
                className={`px-3 py-1.5 rounded-lg border transition ${
                  activityFilter === "missed_skipped"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Missed / Skipped ({stats.missedSkippedPickups})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs ml-auto">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search address, resident, category…"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Content Table / Empty States */}
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
                onClick={() => {
                  setActivitySearch("");
                  setActivityFilter("all");
                }}
                className="mt-3 text-xs font-medium text-emerald-600 hover:underline"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                    <th className="px-6 py-3">Scheduled Date</th>
                    <th className="px-6 py-3">Resident & Address</th>
                    <th className="px-6 py-3">Waste Category</th>
                    <th className="px-6 py-3">Zone</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredActivity.map((pickup) => {
                    const relative = getRelativeDateLabel(pickup.scheduled_date, pickup.status);
                    return (
                      <tr key={pickup.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Date Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-medium text-slate-900">{formatPickupDate(pickup.scheduled_date)}</p>
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
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-900">
                              {pickup.address.street}
                              {pickup.address.unit ? `, ${pickup.address.unit}` : ""}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              {pickup.address.city} {pickup.address.postal_code}
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-slate-50 border border-slate-200">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: pickup.waste_category.color_code || "#64748b" }}
                            />
                            <span className="font-medium text-slate-800">{pickup.waste_category.name}</span>
                          </div>
                        </td>

                        {/* Zone Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {pickup.zone_name ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 text-slate-700 font-medium">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {pickup.zone_name}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Status Column */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={pickup.status} />
                        </td>

                        {/* Notes Column */}
                        <td className="px-6 py-4 text-right text-slate-500 max-w-xs truncate">
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

                    <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="font-medium text-slate-900">
                        {pickup.address.street}
                        {pickup.address.unit ? `, ${pickup.address.unit}` : ""}
                      </p>
                      <p className="text-slate-500">
                        {pickup.address.city} {pickup.address.postal_code}
                      </p>
                      {pickup.resident_email && (
                        <p className="text-emerald-700 flex items-center gap-1 pt-1 font-mono">
                          <Users className="h-3 w-3" />
                          {pickup.resident_email}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: pickup.waste_category.color_code || "#64748b" }}
                        />
                        <span className="font-medium text-slate-800">{pickup.waste_category.name}</span>
                      </div>
                      {pickup.zone_name && (
                        <span className="text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pickup.zone_name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ─── Quick Links Section ─────────────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2 text-base">
          <Layers className="h-5 w-5 text-slate-400" />
          Quick Management Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { href: "/admin/residents", label: "Manage Residents", desc: "View users & role permissions", icon: Users, color: "text-blue-600" },
            { href: "/admin/addresses", label: "Manage Addresses", desc: "Assign zones & manage units", icon: Building2, color: "text-violet-600" },
            { href: "/admin/zones", label: "Manage Zones", desc: "Create & edit collection zones", icon: MapPin, color: "text-emerald-600" },
            { href: "/admin/schedules", label: "Manage Schedules", desc: "Set rules & generate pickups", icon: CalendarClock, color: "text-amber-600" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg border border-slate-100 bg-slate-50 p-4 hover:bg-slate-100 hover:border-slate-200 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <link.icon className={`h-4 w-4 ${link.color}`} />
                <p className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm">
                  {link.label}
                </p>
              </div>
              <p className="text-xs text-slate-500">{link.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
