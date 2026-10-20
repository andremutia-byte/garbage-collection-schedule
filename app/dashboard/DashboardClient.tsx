"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Home,
  Loader2,
  MapPin,
  Plus,
  Recycle,
  Trash2,
  X,
  AlertCircle,
  Leaf,
  Phone,
  ArrowRight,
} from "lucide-react";
import type {
  DashboardData,
  AddressItem,
  UpcomingPickup,
} from "@/app/actions/dashboard";
import type { BarangayItem } from "@/app/actions/barangays";
import {
  addAddress,
  removeAddress,
  updateNotificationPref,
  updateResidentPhone,
} from "@/app/actions/dashboard";
import { validatePhilippinePhone } from "@/lib/phone";
import type { ResidentNotification } from "@/app/actions/notifications";
import { CollectionSchedule } from "./CollectionSchedule";

interface DashboardClientProps {
  data: DashboardData;
  notifications?: ResidentNotification[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return "Past";
  return `In ${diff} days`;
}

function getCategoryDetails(name: string) {
  const n = name.toLowerCase();
  if (n.includes("recycl")) {
    return {
      bg: "bg-blue-50/70",
      border: "border-blue-200",
      text: "text-blue-800",
      badgeBg: "bg-blue-100 text-blue-800 border-blue-200",
      iconBg: "bg-blue-600 text-white",
      icon: <Recycle className="h-6 w-6" />,
      guideline: "Clean plastics, paper, cardboard, bottles, and metals.",
    };
  }
  if (n.includes("green") || n.includes("biodegrad") || n.includes("organic") || n.includes("leaf")) {
    return {
      bg: "bg-emerald-50/70",
      border: "border-emerald-200",
      text: "text-emerald-800",
      badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-600 text-white",
      icon: <Leaf className="h-6 w-6" />,
      guideline: "Food scraps, fruit peels, garden trimmings, and leaves.",
    };
  }
  if (n.includes("hazard")) {
    return {
      bg: "bg-amber-50/70",
      border: "border-amber-200",
      text: "text-amber-800",
      badgeBg: "bg-amber-100 text-amber-800 border-amber-200",
      iconBg: "bg-amber-600 text-white",
      icon: <AlertCircle className="h-6 w-6" />,
      guideline: "Batteries, electronics, chemicals, paints, and medical waste.",
    };
  }
  return {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-800",
    badgeBg: "bg-slate-100 text-slate-800 border-slate-200",
    iconBg: "bg-slate-700 text-white",
    icon: <Trash2 className="h-6 w-6" />,
    guideline: "Non-recyclable household residual waste in tied trash bags.",
  };
}

function getCategoryStyle(name: string) {
  const n = name.toLowerCase();
  if (n.includes("recycl")) return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: <Recycle className="h-5 w-5" /> };
  if (n.includes("green") || n.includes("garden") || n.includes("organic") || n.includes("leaf")) return { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: <Leaf className="h-5 w-5" /> };
  return { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-600", icon: <Trash2 className="h-5 w-5" /> };
}

const NOTIF_OPTIONS = [
  { value: "email", label: "Email", desc: "Get reminders via email" },
  { value: "sms", label: "SMS", desc: "Text message alerts" },
  { value: "push", label: "Push", desc: "Browser push notifications" },
  { value: "none", label: "None", desc: "No reminders" },
] as const;

// ─── Add Address Modal ─────────────────────────────────────────────────────────

function AddAddressModal({
  availableBarangays,
  onClose,
  onSuccess,
}: {
  availableBarangays: BarangayItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await addAddress(fd);
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error ?? "An error occurred.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add Household Address</h2>
            <p className="text-sm text-slate-500 mt-0.5">Register your Butuan City address for collection schedules</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Barangay Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-barangay">
              Barangay <span className="text-red-500">*</span>
            </label>
            <select
              id="addr-barangay"
              name="barangay_id"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition cursor-pointer"
            >
              <option value="">Select your barangay ({availableBarangays.length} available)…</option>
              {availableBarangays.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Your collection schedules and pickup reminders are strictly configured for your barangay.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-street">
              Street / Purok / Subdivision <span className="text-red-500">*</span>
            </label>
            <input
              id="addr-street"
              name="street"
              type="text"
              required
              placeholder="e.g. Purok 3, Montilla Blvd, or Villa Kananga Rd"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-unit">
              House / Unit / Block & Lot <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="addr-unit"
              name="unit"
              type="text"
              placeholder="e.g. Block 4 Lot 12 or Apt 2"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-city">
                City <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-city"
                name="city"
                type="text"
                required
                defaultValue="Butuan City"
                placeholder="Butuan City"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-postal">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                id="addr-postal"
                name="postal_code"
                type="text"
                required
                defaultValue="8600"
                placeholder="8600"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Add Address"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Address Card ──────────────────────────────────────────────────────────────

function AddressCard({
  address,
  onRemove,
}: {
  address: AddressItem;
  onRemove: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      await removeAddress(address.id);
      onRemove(address.id);
    });
  };

  return (
    <div className={`relative rounded-2xl border p-5 shadow-2xs transition-all ${address.is_primary ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
      {address.is_primary && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-3 w-3" /> Primary
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${address.is_primary ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          <Home className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900 truncate text-sm sm:text-base">
            {address.street}{address.unit ? `, ${address.unit}` : ""}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
            {address.barangay_name ? `Barangay ${address.barangay_name}, ` : ""}
            {address.city} {address.postal_code}
          </p>
        </div>
      </div>

      <button
        onClick={handleRemove}
        disabled={isPending}
        className="mt-4 w-full rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 py-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
      >
        {isPending ? (
          <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Removing…</>
        ) : (
          <><X className="h-3.5 w-3.5" /> Remove Address</>
        )}
      </button>
    </div>
  );
}

// ─── Grouped Upcoming Pickups ──────────────────────────────────────────────────

export type PickupCategoryGroup = "General Waste" | "Recyclables" | "Green Garden Waste";

export function getPickupCategoryGroup(categoryName: string): PickupCategoryGroup {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("recycl")) {
    return "Recyclables";
  }
  if (
    name.includes("green") ||
    name.includes("garden") ||
    name.includes("bio") ||
    name.includes("organic") ||
    name.includes("leaf")
  ) {
    return "Green Garden Waste";
  }
  return "General Waste";
}

interface CategoryGroupMeta {
  id: PickupCategoryGroup;
  title: string;
  icon: typeof Trash2;
  description: string;
  iconClass: string;
  badgeClass: string;
  accentClass: string;
}

const CATEGORY_GROUPS_CONFIG: CategoryGroupMeta[] = [
  {
    id: "General Waste",
    title: "General Waste",
    icon: Trash2,
    description: "Residual, non-recyclable household waste",
    iconClass: "bg-slate-100 text-slate-700 border-slate-200",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    accentClass: "border-slate-200",
  },
  {
    id: "Recyclables",
    title: "Recyclables",
    icon: Recycle,
    description: "Plastics, paper, clean cardboard, glass & metals",
    iconClass: "bg-blue-50 text-blue-600 border-blue-200",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    accentClass: "border-blue-100",
  },
  {
    id: "Green Garden Waste",
    title: "Green Garden Waste",
    icon: Leaf,
    description: "Garden cuttings, leaves & compostable organics",
    iconClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accentClass: "border-emerald-100",
  },
];

function GroupedPickupCard({ pickup }: { pickup: UpcomingPickup }) {
  const urgency = daysUntil(pickup.scheduled_date);
  const isUrgent = urgency === "Today" || urgency === "Tomorrow";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date, Status, and Collection Time */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-emerald-600 shrink-0" />
              {formatDate(pickup.scheduled_date)}
            </span>

            {isUrgent ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800 shrink-0">
                <Bell className="h-3 w-3" /> {urgency}
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600 shrink-0">
                {urgency}
              </span>
            )}

            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 capitalize shrink-0">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              {pickup.status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>{pickup.collection_time || "06:00 AM – 09:00 AM"}</span>
          </div>
        </div>

        {/* Address */}
        <div className="text-xs text-slate-500 sm:text-right flex sm:flex-col items-start sm:items-end gap-1 sm:gap-0.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
          <div className="flex items-center gap-1 text-slate-700 font-medium">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate max-w-[280px]">
              {pickup.address.street}
              {pickup.address.unit ? `, ${pickup.address.unit}` : ""}
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            {pickup.address.barangay_name
              ? `Brgy. ${pickup.address.barangay_name}, ${pickup.address.city}`
              : pickup.address.city}
          </span>
        </div>
      </div>
    </div>
  );
}

function CollapsiblePickupGroup({
  meta,
  pickups,
  isOpen,
  onToggle,
}: {
  meta: CategoryGroupMeta;
  pickups: UpcomingPickup[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = meta.icon;
  const count = pickups.length;

  return (
    <div className={`flex flex-col rounded-2xl border ${meta.accentClass} bg-white shadow-2xs overflow-hidden transition-all w-full`}>
      {/* Category Header Button — Always visible while scrolling inside this category */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`group-content-${meta.id.replace(/\s+/g, "-").toLowerCase()}`}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-slate-50/80 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
          <div
            className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl border ${meta.iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                {meta.title}
              </h3>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold ${meta.badgeClass}`}
              >
                {count} {count === 1 ? "pickup" : "pickups"}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate mt-0.5">
              {meta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-3 shrink-0">
          <span className="hidden sm:inline-block text-xs font-semibold text-slate-500">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </button>

      {/* Category Pickup List with Independent Vertical Scrollbar */}
      {isOpen && (
        <div
          id={`group-content-${meta.id.replace(/\s+/g, "-").toLowerCase()}`}
          className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 space-y-2.5 max-h-[300px] sm:max-h-[340px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2"
          style={{ overscrollBehaviorY: "contain" }}
        >
          {pickups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center rounded-xl border border-dashed border-slate-200 bg-white/70">
              <p className="font-semibold text-slate-700 text-xs sm:text-sm">
                No upcoming pickups
              </p>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xs">
                No {meta.title.toLowerCase()} pickups scheduled in the next 30 days for your address.
              </p>
            </div>
          ) : (
            pickups.map((pickup) => (
              <GroupedPickupCard key={pickup.id} pickup={pickup} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Notification Pref Section ─────────────────────────────────────────────────

function NotificationSettings({ current }: { current: string }) {
  const [selected, setSelected] = useState(current);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateNotificationPref(
        selected as "email" | "sms" | "push" | "none"
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div id="alert-options" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs scroll-mt-24">
      <div className="flex items-center gap-3 mb-4 sm:mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Reminder Preferences</h3>
          <p className="text-xs sm:text-sm text-slate-500">How should we notify you before collection?</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
        {NOTIF_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
              selected === opt.value
                ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-200"
                : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <p className={`text-sm font-semibold ${selected === opt.value ? "text-emerald-800" : "text-slate-800"}`}>
              {opt.label}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending || selected === current}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Preference
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Saved!
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Contact Number Section ───────────────────────────────────────────────────

function ContactSettings({ currentPhone }: { currentPhone: string | null }) {
  const [phone, setPhone] = useState(currentPhone ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validatePhilippinePhone(phone);
    if (!validation.valid || !validation.normalized) {
      setError(
        validation.error ||
          "Please enter a valid Philippine mobile number (e.g., 09XXXXXXXXX or +639XXXXXXXXX)."
      );
      return;
    }

    startTransition(async () => {
      const res = await updateResidentPhone(validation.normalized!);
      if (res.success) {
        setSaved(true);
        setPhone(validation.normalized!);
        setTimeout(() => setSaved(false), 3500);
      } else {
        setError(res.error || "Failed to update contact number.");
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Contact Number</h3>
            <p className="text-xs sm:text-sm text-slate-500">For resident inquiries & collection updates</p>
          </div>
        </div>
        {currentPhone && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" /> Registered
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        <div>
          <label htmlFor="resident-phone-input" className="block text-xs font-medium text-slate-700 mb-1">
            Resident Contact Number
          </label>
          <input
            id="resident-phone-input"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (error) setError(null);
            }}
            placeholder="09XXXXXXXXX or +639XXXXXXXXX"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Valid Philippine format: <span className="font-mono text-slate-700">09XXXXXXXXX</span> or{" "}
            <span className="font-mono text-slate-700">+639XXXXXXXXX</span>
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={isPending || (phone === (currentPhone ?? "") && !!currentPhone)}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {currentPhone ? "Update Contact Number" : "Save Contact Number"}
          </button>

          {saved && (
            <span className="flex items-center gap-1.5 text-xs sm:text-sm text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Saved!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

// ─── Empty States ──────────────────────────────────────────────────────────────

function EmptyAddresses({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-10 text-center">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3 border border-slate-200">
        <Home className="h-6 w-6" />
      </div>
      <p className="font-semibold text-slate-800 text-sm sm:text-base">No addresses yet</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
        Add your home address to start seeing your personalized collection schedule.
      </p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Add First Address
      </button>
    </div>
  );
}

function EmptyPickups() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 sm:p-10 text-center">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3 border border-slate-200">
        <CalendarDays className="h-6 w-6" />
      </div>
      <p className="font-semibold text-slate-800 text-sm sm:text-base">No upcoming pickups</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
        No collection events scheduled in the next 30 days for your registered address.
      </p>
    </div>
  );
}



// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function DashboardClient({ data, notifications }: DashboardClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>(data.addresses);

  const handleAddressRemoved = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  // Collapsible category groups state
  const [openGroups, setOpenGroups] = useState<Record<PickupCategoryGroup, boolean>>({
    "General Waste": true,
    "Recyclables": true,
    "Green Garden Waste": true,
  });

  const toggleGroup = (key: PickupCategoryGroup) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allExpanded = Object.values(openGroups).every(Boolean);

  const toggleAllGroups = () => {
    const nextState = !allExpanded;
    setOpenGroups({
      "General Waste": nextState,
      "Recyclables": nextState,
      "Green Garden Waste": nextState,
    });
  };

  // Group upcoming pickups into the 3 categories
  const groupedPickups = useMemo(() => {
    const groups: Record<PickupCategoryGroup, UpcomingPickup[]> = {
      "General Waste": [],
      "Recyclables": [],
      "Green Garden Waste": [],
    };

    for (const pickup of data.upcomingPickups) {
      const catGroup = getPickupCategoryGroup(pickup.waste_category.name);
      groups[catGroup].push(pickup);
    }

    // Sort by scheduled_date then collection_time ascending
    for (const key of Object.keys(groups) as PickupCategoryGroup[]) {
      groups[key].sort((a, b) => {
        const dateCmp = a.scheduled_date.localeCompare(b.scheduled_date);
        if (dateCmp !== 0) return dateCmp;
        return (a.collection_time || "").localeCompare(b.collection_time || "");
      });
    }

    return groups;
  }, [data.upcomingPickups]);

  const totalPickupsCount =
    groupedPickups["General Waste"].length +
    groupedPickups["Recyclables"].length +
    groupedPickups["Green Garden Waste"].length;

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          My Schedule
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">
          Track your household collection dates, upcoming pickups, and address settings in Butuan City.
        </p>
      </div>

      {/* ── Error Banner (if database query encountered error) ── */}
      {data.error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice: Live updates unavailable</p>
            <p className="text-amber-800 text-xs sm:text-sm mt-0.5">{data.error}</p>
          </div>
        </div>
      )}



      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: addresses + notif pref */}
        <div className="lg:col-span-1 space-y-6">
          {/* Addresses section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                My Addresses
              </h2>
              <button
                id="add-address-btn"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {addresses.length === 0 ? (
              <EmptyAddresses onAdd={() => setShowAddModal(true)} />
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    onRemove={handleAddressRemoved}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Contact Information */}
          <ContactSettings currentPhone={data.phone} />

          {/* Notification pref */}
          <NotificationSettings current={data.notificationPref} />
        </div>

        {/* Right: upcoming pickups */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                Upcoming Pickups
              </h2>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                Next 30 days
              </span>
            </div>

            {totalPickupsCount > 0 && (
              <button
                type="button"
                onClick={toggleAllGroups}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {allExpanded ? "Collapse All" : "Expand All"}
              </button>
            )}
          </div>

          {addresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-slate-400 mb-4">
                <CalendarDays className="h-7 w-7" />
              </div>
              <p className="font-semibold text-slate-700">Add an address first</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Register your address to see your personalised collection schedule.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Add Address
              </button>
            </div>
          ) : totalPickupsCount === 0 ? (
            <EmptyPickups />
          ) : (
            <div className="space-y-4">
              {CATEGORY_GROUPS_CONFIG.map((groupMeta) => (
                <CollapsiblePickupGroup
                  key={groupMeta.id}
                  meta={groupMeta}
                  pickups={groupedPickups[groupMeta.id]}
                  isOpen={Boolean(openGroups[groupMeta.id])}
                  onToggle={() => toggleGroup(groupMeta.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Redesigned Collection Schedule Section ── */}
      <CollectionSchedule
        schedules={data.barangaySchedules}
        pickups={data.allPickups}
        addresses={addresses}
        onAddAddress={() => setShowAddModal(true)}
      />

      {/* ── Add address modal ── */}
      {showAddModal && (
        <AddAddressModal
          availableBarangays={data.availableBarangays}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            // Page re-render via revalidatePath handles the update
          }}
        />
      )}
    </>
  );
}
