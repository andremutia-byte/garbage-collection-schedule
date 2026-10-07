"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Home,
  Loader2,
  MapPin,
  Plus,
  Recycle,
  Trash2,
  X,
  AlertCircle,
  Leaf,
} from "lucide-react";
import type {
  DashboardData,
  AddressWithZone,
  UpcomingPickup,
} from "@/app/actions/dashboard";
import {
  addAddress,
  removeAddress,
  updateNotificationPref,
} from "@/app/actions/dashboard";
import type { ResidentNotification } from "@/app/actions/notifications";
import { NotificationsPanel } from "./NotificationsPanel";
import { CollectionSchedule } from "./CollectionSchedule";

interface Zone {
  id: string;
  name: string;
  description: string | null;
}

interface DashboardClientProps {
  data: DashboardData;
  zones: Zone[];
  notifications: ResidentNotification[];
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

function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `In ${diff} days`;
}

function getCategoryStyle(name: string, colorCode: string | null) {
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
  zones,
  onClose,
  onSuccess,
}: {
  zones: Zone[];
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
            <h2 className="text-lg font-semibold text-slate-900">Add Address</h2>
            <p className="text-sm text-slate-500 mt-0.5">Register a new collection address</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-street">
              Street Address <span className="text-red-500">*</span>
            </label>
            <input
              id="addr-street"
              name="street"
              type="text"
              required
              placeholder="123 Main St"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-unit">
              Unit / Apt <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              id="addr-unit"
              name="unit"
              type="text"
              placeholder="Apt 4B"
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
                placeholder="Springfield"
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
                placeholder="12345"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {zones.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="addr-zone">
                Collection Zone <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <select
                id="addr-zone"
                name="zone_id"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              >
                <option value="">Select a zone…</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
  address: AddressWithZone;
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
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{address.city} {address.postal_code}</p>
          {address.zone && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              <MapPin className="h-3 w-3 shrink-0" />
              Zone: {address.zone.name}
            </div>
          )}
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

// ─── Pickup Card ───────────────────────────────────────────────────────────────

function PickupCard({ pickup }: { pickup: UpcomingPickup }) {
  const style = getCategoryStyle(pickup.waste_category.name, pickup.waste_category.color_code);
  const urgency = daysUntil(pickup.scheduled_date);
  const isUrgent = urgency === "Today" || urgency === "Tomorrow";

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 shadow-2xs transition-all hover:shadow-xs ${style.bg} ${style.border}`}>
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text} border ${style.border}`}>
        {style.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`font-semibold text-sm ${style.text}`}>{pickup.waste_category.name}</p>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
              <Bell className="h-3 w-3" /> {urgency}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-700 mt-0.5">
          <CalendarDays className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5 text-slate-400" />
          {formatDate(pickup.scheduled_date)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">
          {pickup.address.street}{pickup.address.unit ? `, ${pickup.address.unit}` : ""}, {pickup.address.city}
        </p>
      </div>
      {!isUrgent && (
        <span className="flex-shrink-0 text-xs font-medium text-slate-500 bg-white border border-slate-200/80 rounded-full px-2.5 py-1">
          {urgency}
        </span>
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
      await updateNotificationPref(selected as any);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs">
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

export function DashboardClient({ data, zones, notifications }: DashboardClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addresses, setAddresses] = useState<AddressWithZone[]>(data.addresses);

  const handleAddressRemoved = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const nextPickup = data.upcomingPickups[0] ?? null;

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          My Schedule
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-500">
          Manage your household address and track scheduled waste collections.
        </p>
      </div>

      {/* ── Next pickup hero ── */}
      {nextPickup && (
        <div className="mb-6 sm:mb-8 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 sm:p-6 text-white shadow-md border border-emerald-600">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-1.5">Next Scheduled Collection</p>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shrink-0 border border-white/20">
              {getCategoryStyle(nextPickup.waste_category.name, nextPickup.waste_category.color_code).icon}
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">{nextPickup.waste_category.name}</p>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
                {formatDate(nextPickup.scheduled_date)} &bull; {daysUntil(nextPickup.scheduled_date)}
              </p>
            </div>
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
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
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

          {/* Notification pref */}
          <NotificationSettings current={data.notificationPref} />
        </div>

        {/* Right: upcoming pickups */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Upcoming Pickups
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                Next 30 days
              </span>
            </h2>
          </div>

          {data.upcomingPickups.length === 0 ? (
            addresses.length === 0 ? (
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
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Add Address
                </button>
              </div>
            ) : (
              <EmptyPickups />
            )
          ) : (
            <div className="space-y-3">
              {data.upcomingPickups.map((pickup) => (
                <PickupCard key={pickup.id} pickup={pickup} />
              ))}
              {data.upcomingPickups.length >= 20 && (
                <p className="text-center text-sm text-slate-400 py-2">
                  Showing 20 upcoming pickups
                </p>
              )}
            </div>
          )}

          {/* ── Notifications ── */}
          <div className="mt-6">
            <NotificationsPanel notifications={notifications} />
          </div>
        </div>
      </div>

      {/* ── Full Schedule Calendar / List ── */}
      {addresses.length > 0 && (
        <CollectionSchedule pickups={data.allPickups} />
      )}

      {/* ── Add address modal ── */}
      {showAddModal && (
        <AddAddressModal
          zones={zones}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            // Page re-render via revalidatePath handles the update
          }}
        />
      )}
    </>
  );
}
