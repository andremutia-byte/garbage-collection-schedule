"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  CheckCircle2,
  Home,
  Loader2,
  MapPin,
  Plus,
  Phone,
  AlertCircle,
  X,
} from "lucide-react";
import type {
  DashboardData,
  AddressItem,
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
    <div className={`relative rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all ${address.is_primary ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
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
        className="mt-3.5 w-full rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 py-2 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
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

// ─── Empty Addresses State ─────────────────────────────────────────────────────

function EmptyAddresses({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-6 sm:p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2.5 border border-slate-200">
        <Home className="h-6 w-6" />
      </div>
      <p className="font-semibold text-slate-800 text-sm sm:text-base">No addresses yet</p>
      <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs leading-relaxed">
        Add your home address to start seeing your personalized collection schedule.
      </p>
      <button
        onClick={onAdd}
        className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
      >
        <Plus className="h-4 w-4" /> Add First Address
      </button>
    </div>
  );
}

// ─── Contact Settings Section ─────────────────────────────────────────────────

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
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

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export function DashboardClient({ data }: DashboardClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>(data.addresses);

  const handleAddressRemoved = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <>
      {/* ── Page header ── */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          My Schedule
        </h1>
        <p className="mt-1 text-sm sm:text-base text-slate-600">
          Track your household collection dates, weekly pickup schedules, and address settings in Butuan City.
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

      {/* ── 1. Main Section: Collection Schedule (Full Width at Top) ── */}
      <div className="mb-8 sm:mb-10">
        <CollectionSchedule
          schedules={data.barangaySchedules}
          pickups={data.allPickups}
          addresses={addresses}
          onAddAddress={() => setShowAddModal(true)}
        />
      </div>

      {/* ── 2. Resident Information & Settings ── */}
      <div className="space-y-6 sm:space-y-8">
        {/* Top Row: My Addresses (Left) & Contact Number (Right) on desktop; stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Left: My Addresses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                      My Addresses
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Registered household locations in Butuan City
                    </p>
                  </div>
                </div>
                <button
                  id="add-address-btn"
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
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
          </div>

          {/* Right: Contact Number */}
          <ContactSettings currentPhone={data.phone} />
        </div>

        {/* Bottom Row: Reminder Preferences (Full Width on desktop and mobile) */}
        <NotificationSettings current={data.notificationPref} />
      </div>

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
