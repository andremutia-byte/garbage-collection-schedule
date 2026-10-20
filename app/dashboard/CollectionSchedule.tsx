"use client";

import { useState, useMemo } from "react";
import type { UpcomingPickup, AddressItem } from "@/app/actions/dashboard";
import type { ScheduleItem } from "@/app/actions/barangays";
import {
  CalendarDays,
  MapPin,
  Recycle,
  Leaf,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  ChevronRight,
  Filter,
  Sparkles,
  Info,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types & Categories
// ─────────────────────────────────────────────

export interface CollectionScheduleProps {
  schedules: ScheduleItem[];
  pickups: UpcomingPickup[];
  addresses: AddressItem[];
  onAddAddress?: () => void;
}

export type WasteFilterType =
  | "All"
  | "General Waste"
  | "Recyclables"
  | "Green Garden Waste";

export type UnifiedCollectionItem = {
  id: string;
  scheduled_date: string;
  collection_time: string;
  waste_category: {
    id?: string;
    name: string;
    color_code?: string | null;
    instructions?: string | null;
  };
  address: {
    id?: string;
    street: string;
    unit?: string | null;
    city: string;
    barangay_name?: string | null;
  };
  status: string;
  isProjected?: boolean;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getCategoryGroup(name: string): "General Waste" | "Recyclables" | "Green Garden Waste" {
  const n = (name || "").toLowerCase();
  if (n.includes("recycl")) return "Recyclables";
  if (
    n.includes("green") ||
    n.includes("garden") ||
    n.includes("organic") ||
    n.includes("bio") ||
    n.includes("leaf")
  ) {
    return "Green Garden Waste";
  }
  return "General Waste";
}

function getCategoryConfig(categoryName: string) {
  const group = getCategoryGroup(categoryName);
  switch (group) {
    case "Recyclables":
      return {
        label: "Recyclables",
        icon: Recycle,
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
        chipActive: "bg-blue-600 text-white border-blue-600 shadow-xs",
        chipInactive: "bg-white text-slate-700 border-slate-200 hover:bg-blue-50/50 hover:text-blue-700",
        cardBg: "bg-blue-50/40 border-blue-200",
        iconContainer: "bg-blue-100 text-blue-700 border-blue-200",
        textClass: "text-blue-800",
        guideline: "Clean plastic containers, bottles, dry paper, cardboard, and aluminum cans.",
      };
    case "Green Garden Waste":
      return {
        label: "Green Garden Waste",
        icon: Leaf,
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
        chipActive: "bg-emerald-600 text-white border-emerald-600 shadow-xs",
        chipInactive: "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50/50 hover:text-emerald-800",
        cardBg: "bg-emerald-50/40 border-emerald-200",
        iconContainer: "bg-emerald-100 text-emerald-800 border-emerald-200",
        textClass: "text-emerald-800",
        guideline: "Fruit & vegetable peels, food leftovers, garden cuttings, grass, and dry leaves.",
      };
    case "General Waste":
    default:
      return {
        label: "General Waste",
        icon: Trash2,
        badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
        chipActive: "bg-slate-700 text-white border-slate-700 shadow-xs",
        chipInactive: "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900",
        cardBg: "bg-slate-50/80 border-slate-200",
        iconContainer: "bg-slate-200 text-slate-700 border-slate-300",
        textClass: "text-slate-800",
        guideline: "Residual, non-recyclable household waste sealed tightly in trash bags.",
      };
  }
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatLongDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(iso + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Past";
  return `In ${diff} days`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function CollectionSchedule({
  schedules,
  pickups,
  addresses,
  onAddAddress,
}: CollectionScheduleProps) {
  // Address selection state (defaults to primary address or the first registered address)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const primary = addresses.find((a) => a.is_primary);
    return primary ? primary.id : addresses[0]?.id || "";
  });

  // Keep selectedAddressId valid if addresses list changes
  const activeAddress = useMemo(() => {
    if (!addresses || addresses.length === 0) return null;
    const match = addresses.find((a) => a.id === selectedAddressId);
    return match || addresses.find((a) => a.is_primary) || addresses[0];
  }, [addresses, selectedAddressId]);

  // Waste filter state
  const [selectedFilter, setSelectedFilter] = useState<WasteFilterType>("All");

  // Show more toggle for long lists
  const [showAllCollections, setShowAllCollections] = useState(false);

  // Compute upcoming collections for the selected address and barangay
  const upcomingCollections = useMemo<UnifiedCollectionItem[]>(() => {
    if (!activeAddress) return [];

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const selectedBarangay = activeAddress.barangay_name?.toLowerCase().trim() || "";

    // 1. Check materialized upcoming pickups for this address
    const directPickups = pickups
      .filter((p) => {
        if (p.address?.id && activeAddress.id) {
          return p.address.id === activeAddress.id;
        }
        if (p.address?.barangay_name && selectedBarangay) {
          return p.address.barangay_name.toLowerCase().trim() === selectedBarangay;
        }
        return true;
      })
      .filter((p) => p.scheduled_date >= today && p.status === "scheduled")
      .map((p) => ({
        id: p.id,
        scheduled_date: p.scheduled_date,
        collection_time: p.collection_time || "06:00 AM – 09:00 AM",
        waste_category: p.waste_category,
        address: {
          id: p.address.id || activeAddress.id,
          street: p.address.street || activeAddress.street,
          unit: p.address.unit || activeAddress.unit,
          city: p.address.city || activeAddress.city,
          barangay_name: p.address.barangay_name || activeAddress.barangay_name,
        },
        status: p.status,
        isProjected: false,
      }));

    if (directPickups.length > 0) {
      return directPickups.sort((a, b) => {
        const dCmp = a.scheduled_date.localeCompare(b.scheduled_date);
        if (dCmp !== 0) return dCmp;
        return a.collection_time.localeCompare(b.collection_time);
      });
    }

    // 2. If no materialized pickups exist yet for this address, project upcoming dates from active schedules for this barangay
    const activeRules = schedules.filter((s) => {
      if (!s.is_active) return false;
      if (!s.barangay_name) return true;
      const b = s.barangay_name.toLowerCase().trim();
      return b === selectedBarangay || b === "all barangays" || b === "all";
    });

    if (activeRules.length === 0) {
      return [];
    }

    const projected: UnifiedCollectionItem[] = [];
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Project collections for the next 14 days
    for (let i = 0; i < 14; i++) {
      const targetDate = new Date(todayDate);
      targetDate.setDate(todayDate.getDate() + i);
      const dayOfWeek = targetDate.getDay();

      const matchingRules = activeRules.filter(
        (s) => s.day_of_week === dayOfWeek
      );

      for (const rule of matchingRules) {
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, "0");
        const d = String(targetDate.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;

        projected.push({
          id: `projected-${rule.id}-${dateStr}`,
          scheduled_date: dateStr,
          collection_time: rule.collection_time || "06:00 AM – 09:00 AM",
          waste_category: {
            id: rule.category.id,
            name: rule.category.name,
            color_code: rule.category.color_code,
            instructions: rule.category.instructions,
          },
          address: {
            id: activeAddress.id,
            street: activeAddress.street,
            unit: activeAddress.unit,
            city: activeAddress.city,
            barangay_name: activeAddress.barangay_name,
          },
          status: "scheduled",
          isProjected: true,
        });
      }
    }

    projected.sort((a, b) => {
      const dCmp = a.scheduled_date.localeCompare(b.scheduled_date);
      if (dCmp !== 0) return dCmp;
      return a.collection_time.localeCompare(b.collection_time);
    });

    return projected;
  }, [activeAddress, pickups, schedules]);

  // Next collection is the earliest upcoming item
  const nextCollection = upcomingCollections[0] ?? null;

  // Filter items for "This Week's Schedule"
  const filteredCollections = useMemo(() => {
    if (selectedFilter === "All") return upcomingCollections;
    return upcomingCollections.filter(
      (item) => getCategoryGroup(item.waste_category.name) === selectedFilter
    );
  }, [upcomingCollections, selectedFilter]);

  // Limit display to keep layout clean and avoid overcrowded lists
  const displayLimit = 6;
  const visibleCollections = showAllCollections
    ? filteredCollections
    : filteredCollections.slice(0, displayLimit);

  // Category counts for the filter pills
  const counts = useMemo(() => {
    const c = {
      All: upcomingCollections.length,
      "General Waste": 0,
      Recyclables: 0,
      "Green Garden Waste": 0,
    };
    for (const item of upcomingCollections) {
      const grp = getCategoryGroup(item.waste_category.name);
      if (grp in c) {
        c[grp]++;
      }
    }
    return c;
  }, [upcomingCollections]);

  // Empty state if resident hasn't added any address
  if (!activeAddress) {
    return (
      <div
        id="collection-schedule-section"
        className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 mt-8 shadow-xs"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CalendarDays className="h-4.5 w-4.5" />
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Collection Schedule
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-3">
            <MapPin className="h-7 w-7" />
          </div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg">
            No Registered Address
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md leading-relaxed">
            Please register your household address in Butuan City to see your
            tailored garbage collection schedule and pickup days.
          </p>
          {onAddAddress && (
            <button
              type="button"
              onClick={onAddAddress}
              className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-4 py-2 shadow-xs transition cursor-pointer"
            >
              Add Address
            </button>
          )}
        </div>
      </div>
    );
  }

  const nextConfig = nextCollection
    ? getCategoryConfig(nextCollection.waste_category.name)
    : null;
  const nextUrgency = nextCollection ? daysUntil(nextCollection.scheduled_date) : null;
  const isNextUrgent = nextUrgency === "Today" || nextUrgency === "Tomorrow";

  return (
    <section
      id="collection-schedule-section"
      className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs"
    >
      {/* ── Section Header & Address Clarity ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CalendarDays className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Collection Schedule
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              Demo Schedule
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official waste collection schedule tailored for your registered address in Butuan City.
          </p>
        </div>

        {/* Address Selector if multiple addresses exist, or clear indicator if single */}
        {addresses.length > 1 ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 sm:px-3 sm:py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Address:
            </span>
            <select
              id="collection-address-selector"
              value={selectedAddressId}
              onChange={(e) => setSelectedAddressId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
            >
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.street}
                  {addr.barangay_name ? ` (Brgy. ${addr.barangay_name})` : ""}
                  {addr.is_primary ? " • Primary" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-medium">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>
              Registered in{" "}
              <strong className="text-slate-900 font-bold">
                Barangay {activeAddress.barangay_name || "Butuan City"}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* ── 1. Top Card: Next Collection ── */}
      <div className="mt-6 mb-8">
        {!nextCollection || !nextConfig ? (
          /* Empty state: No schedule available yet for this barangay */
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 p-6 sm:p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 border border-amber-200 mx-auto mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">
              No collection schedule has been posted for your barangay yet.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg mx-auto leading-relaxed">
              The City of Butuan waste management team has not yet posted active collection
              rules for{" "}
              <strong className="font-semibold text-slate-800">
                Barangay {activeAddress.barangay_name || "your area"}
              </strong>
              . As soon as schedules are published by the city, they will appear here automatically.
            </p>
          </div>
        ) : (
          /* High-impact Next Collection Card */
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-white via-white to-emerald-50/30 p-5 sm:p-7 md:p-8 shadow-xs hover:shadow-sm transition-all">
            {/* Top decorative accent strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            {/* Pill Header: Next Collection & Urgency */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pt-0.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Next Collection
              </div>

              {isNextUrgent ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 text-white px-3 py-1 text-xs font-bold shadow-xs">
                  <Bell className="h-3.5 w-3.5" />
                  {nextUrgency === "Today" ? "Pickup Today!" : "Pickup Tomorrow!"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {nextUrgency}
                </span>
              )}
            </div>

            {/* Main Focus: Next Scheduled Date */}
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                Scheduled Date
              </span>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {formatLongDate(nextCollection.scheduled_date)}
              </h3>
            </div>

            {/* 3 Information Cards (Time, Waste Type, Barangay) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-5 border-t border-slate-100">
              {/* 1. Collection Time */}
              <div className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Collection Time
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                    {nextCollection.collection_time}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Please prepare bins before pickup time
                  </p>
                </div>
              </div>

              {/* 2. Waste Type */}
              <div
                className={`flex items-start gap-3 rounded-2xl border p-4 shadow-2xs ${nextConfig.cardBg}`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${nextConfig.iconContainer}`}
                >
                  <nextConfig.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Waste Type
                  </p>
                  <p className={`text-base sm:text-lg font-extrabold mt-0.5 ${nextConfig.textClass}`}>
                    {nextCollection.waste_category.name}
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                    {nextCollection.waste_category.instructions || nextConfig.guideline}
                  </p>
                </div>
              </div>

              {/* 3. Registered Barangay */}
              <div className="flex items-start gap-3 rounded-2xl bg-white border border-slate-200/90 p-4 shadow-2xs sm:col-span-2 lg:col-span-1">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Registered Barangay
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5 truncate">
                    Barangay {activeAddress.barangay_name || "Butuan City"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {activeAddress.street}
                    {activeAddress.unit ? `, ${activeAddress.unit}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. This Week's Schedule Section ── */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              This Week&apos;s Schedule
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chronological upcoming collections for Barangay{" "}
              {activeAddress.barangay_name || "your area"}
            </p>
          </div>

          {/* Simple Waste-Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
              <Filter className="h-3 w-3 inline mr-1" /> Filter:
            </span>
            {(
              [
                "All",
                "General Waste",
                "Recyclables",
                "Green Garden Waste",
              ] as WasteFilterType[]
            ).map((filterKey) => {
              const isSelected = selectedFilter === filterKey;
              const count = counts[filterKey];
              let icon = null;
              if (filterKey === "General Waste")
                icon = <Trash2 className="h-3.5 w-3.5" />;
              if (filterKey === "Recyclables")
                icon = <Recycle className="h-3.5 w-3.5" />;
              if (filterKey === "Green Garden Waste")
                icon = <Leaf className="h-3.5 w-3.5" />;

              return (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => {
                    setSelectedFilter(filterKey);
                    setShowAllCollections(false);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer border ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {icon}
                  <span>{filterKey === "All" ? "All Waste Types" : filterKey}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isSelected
                        ? "bg-emerald-700/60 text-emerald-50"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chronological List of Collections */}
        {filteredCollections.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 border border-slate-200 mx-auto mb-2.5">
              <CalendarDays className="h-6 w-6" />
            </div>
            <p className="font-bold text-slate-700 text-sm sm:text-base">
              {selectedFilter === "All"
                ? "No collection schedule has been posted for your barangay yet."
                : `No upcoming ${selectedFilter} collections found.`}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {selectedFilter === "All"
                ? "As soon as waste management schedules are configured for this barangay, they will appear here in chronological order."
                : "Try selecting 'All Waste Types' above to view other scheduled collections."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleCollections.map((item) => {
              const cfg = getCategoryConfig(item.waste_category.name);
              const urgency = daysUntil(item.scheduled_date);
              const isUrgent = urgency === "Today" || urgency === "Tomorrow";

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-4.5 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  {/* Left: Icon, Date, and Urgency */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${cfg.iconContainer}`}
                    >
                      <cfg.icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {formatDate(item.scheduled_date)}
                        </span>

                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <Bell className="h-2.5 w-2.5" /> {urgency}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {urgency}
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${cfg.badgeClass}`}
                        >
                          <cfg.icon className="h-3 w-3" />
                          {item.waste_category.name}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 truncate">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>
                          {item.address.street}
                          {item.address.barangay_name
                            ? `, Brgy. ${item.address.barangay_name}`
                            : ""}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Right: Collection Time and Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800">
                        <Clock className="h-3.5 w-3.5 text-emerald-600" />
                        {item.collection_time}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {item.waste_category.instructions || cfg.guideline.slice(0, 40) + "…"}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Scheduled
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Show more toggle if list is long */}
            {filteredCollections.length > displayLimit && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllCollections((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer py-1.5 px-3 rounded-lg hover:bg-emerald-50 transition"
                >
                  {showAllCollections
                    ? "Show fewer collections"
                    : `Show all ${filteredCollections.length} upcoming collections`}
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${
                      showAllCollections ? "-rotate-90" : "rotate-90"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Calendar(props: React.SVGProps<SVGSVGElement>) {
  return <CalendarDays {...props} />;
}
