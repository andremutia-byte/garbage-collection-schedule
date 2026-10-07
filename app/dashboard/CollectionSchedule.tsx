"use client";

import { useState } from "react";
import { UpcomingPickup } from "@/app/actions/dashboard";
import { CalendarDays, MapPin, Recycle, Leaf, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";

interface CollectionScheduleProps {
  pickups: UpcomingPickup[];
}

type Filter = "All" | "Upcoming" | "Completed" | "Cancelled";

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("recycl")) return <Recycle className="h-5 w-5" />;
  if (n.includes("green") || n.includes("garden") || n.includes("organic") || n.includes("leaf")) return <Leaf className="h-5 w-5" />;
  return <Trash2 className="h-5 w-5" />;
}

function getCategoryStyle(name: string, colorCode: string | null) {
  const n = name.toLowerCase();
  if (n.includes("recycl")) return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700" };
  if (n.includes("green") || n.includes("garden") || n.includes("organic") || n.includes("leaf")) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" };
  return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600" };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Completed
        </span>
      );
    case "missed":
    case "skipped":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
          <XCircle className="h-3 w-3" /> {status === "missed" ? "Missed" : "Cancelled"}
        </span>
      );
    case "scheduled":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
          <Clock className="h-3 w-3" /> Scheduled
        </span>
      );
  }
}

export function CollectionSchedule({ pickups }: CollectionScheduleProps) {
  const [filter, setFilter] = useState<Filter>("All");

  const today = new Date().toISOString().slice(0, 10);

  const filteredPickups = pickups.filter((p) => {
    if (filter === "All") return true;
    if (filter === "Upcoming") return p.status === "scheduled" && p.scheduled_date >= today;
    if (filter === "Completed") return p.status === "completed";
    if (filter === "Cancelled") return p.status === "missed" || p.status === "skipped";
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 mt-8 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-600" />
            Collection Schedule
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Review your full pickup history and upcoming schedule.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["All", "Upcoming", "Completed", "Cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                filter === f
                  ? "bg-emerald-600 text-white shadow-2xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredPickups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-10 text-center">
          <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700 text-sm sm:text-base">No pickups found</p>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">Try changing your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPickups.map((pickup) => {
            const style = getCategoryStyle(pickup.waste_category.name, pickup.waste_category.color_code);
            const dateStr = new Date(pickup.scheduled_date + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
              year: "numeric"
            });

            return (
              <div key={pickup.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4.5 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${style.bg} ${style.border} ${style.text}`}>
                    {getCategoryIcon(pickup.waste_category.name)}
                  </div>
                  {getStatusBadge(pickup.status)}
                </div>
                
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{pickup.waste_category.name}</h3>
                <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1">{dateStr}</p>
                
                <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{pickup.address.street}{pickup.address.unit ? `, ${pickup.address.unit}` : ""}, {pickup.address.city}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
