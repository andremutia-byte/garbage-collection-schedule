"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Bell,
  CalendarClock,
  ChevronRight,
  ListChecks,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import type {
  AdminSchedule,
  AdminCategory,
  AdminPickup,
  AdminBarangay,
} from "@/app/actions/admin";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleScheduleActive,
  generatePickupsFromSchedule,
  createPickup,
  updatePickupStatus,
  deletePickup,
} from "@/app/actions/admin";
import { generatePickupReminders } from "@/app/actions/notifications";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  SubmitButton,
  Textarea,
} from "../ui";

// ─── Types ──────────────────────────────────────────────────────────────────

interface AddressItem {
  id: string;
  label: string;
}

interface Props {
  schedules: AdminSchedule[];
  categories: AdminCategory[];
  pickups: AdminPickup[];
  addresses: AddressItem[];
  barangays: AdminBarangay[];
  initialTab?: Tab;
  initialAction?: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly",
  custom: "Custom",
};
const STATUS_OPTIONS = ["scheduled", "completed", "missed", "skipped"] as const;

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Schedule Form ────────────────────────────────────────────────────────────

function ScheduleForm({
  initial,
  categories,
  barangays,
  onClose,
  onSuccess,
}: {
  initial?: AdminSchedule;
  categories: AdminCategory[];
  barangays: AdminBarangay[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Scope: "all" or "specific"
  const [appliesTo, setAppliesTo] = useState<"all" | "specific">(
    initial?.barangay_id ? "specific" : "all"
  );
  const [selectedBarangayIds, setSelectedBarangayIds] = useState<string[]>(
    initial?.barangay_id ? [initial.barangay_id] : []
  );
  const [barangaySearch, setBarangaySearch] = useState("");
  const [timePreset, setTimePreset] = useState(
    initial?.collection_time ?? "06:00 AM – 09:00 AM"
  );

  const filteredBarangays = barangays.filter((b) =>
    b.name.toLowerCase().includes(barangaySearch.toLowerCase())
  );

  const toggleBarangay = (id: string) => {
    setSelectedBarangayIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const idsToAdd = filteredBarangays.map((b) => b.id);
    setSelectedBarangayIds((prev) => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const clearSelection = () => {
    setSelectedBarangayIds([]);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (appliesTo === "specific" && selectedBarangayIds.length === 0) {
      setError("Please select at least one barangay, or choose 'All Barangays'.");
      return;
    }

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = initial
        ? await updateSchedule(initial.id, fd)
        : await createSchedule(fd);
      if (result.success) {
        onSuccess(initial ? "Schedule updated." : "Schedule created.");
        onClose();
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Scope Selector: All Barangays vs Specific */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
          Applicable Barangay(s)
        </label>
        <input type="hidden" name="applies_to" value={appliesTo} />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => setAppliesTo("all")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition border cursor-pointer ${
              appliesTo === "all"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Barangays (City-wide)
          </button>
          <button
            type="button"
            onClick={() => setAppliesTo("specific")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold transition border cursor-pointer ${
              appliesTo === "specific"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {initial ? "Single Barangay" : "Select Specific Barangay(s)"}
          </button>
        </div>

        {appliesTo === "specific" && (
          <div className="mt-3 space-y-3 pt-3 border-t border-slate-200">
            {initial ? (
              /* When editing: single selector */
              <Field label="Target Barangay" required>
                <Select
                  name="barangay_id"
                  defaultValue={initial.barangay_id ?? ""}
                  required
                >
                  <option value="">Select a barangay…</option>
                  {barangays.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              /* When creating: multi-select with search and bulk toggle */
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs text-slate-600 font-medium">
                    <span className="font-semibold text-emerald-700">
                      {selectedBarangayIds.length}
                    </span>{" "}
                    of {barangays.length} barangays selected
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="text-emerald-700 hover:underline font-medium cursor-pointer"
                    >
                      Select all ({filteredBarangays.length})
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search barangay name…"
                    value={barangaySearch}
                    onChange={(e) => setBarangaySearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Hidden form inputs for selected barangays */}
                {selectedBarangayIds.map((bId) => (
                  <input key={bId} type="hidden" name="barangay_ids" value={bId} />
                ))}

                <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 divide-y divide-slate-100 text-xs">
                  {filteredBarangays.length === 0 ? (
                    <div className="py-4 text-center text-slate-400">
                      No barangays match &quot;{barangaySearch}&quot;
                    </div>
                  ) : (
                    filteredBarangays.map((b) => {
                      const isChecked = selectedBarangayIds.includes(b.id);
                      return (
                        <label
                          key={b.id}
                          className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleBarangay(b.id)}
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span
                            className={
                              isChecked
                                ? "font-semibold text-emerald-900"
                                : "text-slate-700"
                            }
                          >
                            {b.name}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Waste Category" required>
          <Select name="waste_category_id" defaultValue={initial?.waste_category_id ?? ""} required>
            <option value="">Select category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Frequency" required>
          <Select name="frequency" defaultValue={initial?.frequency ?? "weekly"} required>
            {Object.entries(FREQ_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>
        <Field label="Collection Day">
          <Select name="day_of_week" defaultValue={initial?.day_of_week?.toString() ?? ""}>
            <option value="">Any / not set</option>
            {DAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </Select>
        </Field>
        <Field label="Collection Time" required>
          <Input
            type="text"
            name="collection_time"
            value={timePreset}
            onChange={(e) => setTimePreset(e.target.value)}
            placeholder="06:00 AM – 09:00 AM"
            required
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {[
              "06:00 AM – 09:00 AM",
              "07:00 AM – 10:00 AM",
              "01:00 PM – 04:00 PM",
              "05:00 PM – 08:00 PM",
            ].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTimePreset(p)}
                className={`text-[10px] px-2 py-0.5 rounded-md border cursor-pointer transition ${
                  timePreset === p
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Start Date" required>
          <Input
            type="date"
            name="start_date"
            defaultValue={initial?.start_date ?? new Date().toISOString().slice(0, 10)}
            required
          />
        </Field>
        <Field label="End Date">
          <Input type="date" name="end_date" defaultValue={initial?.end_date ?? ""} />
        </Field>

        {/* Active Status Checkbox */}
        <div className="sm:col-span-2 pt-2 border-t border-slate-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={initial ? initial.is_active : true}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-slate-800">Active Schedule</span>
              <p className="text-slate-500">
                Active schedules appear on public calendars and generate recurring pickups for addresses. Deactivating pauses generation safely without deleting past records.
              </p>
            </div>
          </label>
        </div>
      </div>
      {error && <Alert type="error" message={error} />}
      <SubmitButton
        loading={isPending}
        label={initial ? "Update Schedule" : "Create Schedule"}
        onCancel={onClose}
      />
    </form>
  );
}

// ─── Toggle Active Button ───────────────────────────────────────────────────

function ToggleActiveButton({
  scheduleId,
  isActive,
  onResult,
}: {
  scheduleId: string;
  isActive: boolean;
  onResult: (msg: string, isError: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() =>
        startTransition(async () => {
          const res = await toggleScheduleActive(scheduleId, !isActive);
          if (res.success) {
            onResult(isActive ? "Schedule deactivated." : "Schedule activated.", false);
          } else {
            onResult(res.error ?? "Failed to toggle status.", true);
          }
        })
      }
      disabled={isPending}
      title={isActive ? "Click to deactivate schedule" : "Click to activate schedule"}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border cursor-pointer transition ${
        isActive
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
      }`}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span
          className={`h-2 w-2 rounded-full ${
            isActive ? "bg-emerald-500" : "bg-slate-400"
          }`}
        />
      )}
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}

// ─── Pickup Form ──────────────────────────────────────────────────────────────

function PickupForm({
  addresses,
  categories,
  onClose,
  onSuccess,
}: {
  addresses: AddressItem[];
  categories: AdminCategory[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPickup(fd);
      if (result.success) {
        onSuccess("Pickup record added.");
        onClose();
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Address" required>
        <Select name="address_id" required>
          <option value="">Select address…</option>
          {addresses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Waste Category" required>
        <Select name="waste_category_id" required>
          <option value="">Select category…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Scheduled Date" required>
          <Input
            type="date"
            name="scheduled_date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            required
          />
        </Field>
        <Field label="Status">
          <Select name="status" defaultValue="scheduled">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <Textarea name="notes" placeholder="Optional notes…" rows={2} />
      </Field>
      {error && <Alert type="error" message={error} />}
      <SubmitButton loading={isPending} label="Add Pickup Record" onCancel={onClose} />
    </form>
  );
}

// ─── Generate Pickups ─────────────────────────────────────────────────────────

function GeneratePickupsButton({ scheduleId, onResult }: { scheduleId: string; onResult: (msg: string, isError: boolean) => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await generatePickupsFromSchedule(scheduleId, 8);
          if (result.success) {
            onResult(`Generated ${result.data?.created ?? 0} pickup event(s).`, false);
          } else {
            onResult(result.error ?? "Failed.", true);
          }
        })
      }
      disabled={isPending}
      title="Generate pickup events for all active addresses from this schedule"
      className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors cursor-pointer"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Generate
    </button>
  );
}

// ─── Notify Residents Button ──────────────────────────────────────────────────

function NotifyButton({ onResult }: { onResult: (msg: string, isError: boolean) => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await generatePickupReminders();
          if (result.success) {
            onResult(
              result.count === 0
                ? "All residents already notified."
                : `Sent ${result.count} reminder(s) to residents.`,
              false
            );
          } else {
            onResult(result.error ?? "Failed to send notifications.", true);
          }
        })
      }
      disabled={isPending}
      title="Send pickup reminders to residents for upcoming pickups"
      className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors cursor-pointer"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bell className="h-3 w-3" />}
      Notify
    </button>
  );
}

// ─── Pickup Status Dropdown ───────────────────────────────────────────────────

function PickupStatusSelect({
  pickupId,
  current,
  onResult,
}: {
  pickupId: string;
  current: string;
  onResult: (msg: string, isError: boolean) => void;
}) {
  const [localStatus, setLocalStatus] = useState(current);
  const [isPending, startTransition] = useTransition();

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500";
      case "scheduled":
        return "bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500";
      case "missed":
        return "bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500";
      case "skipped":
        return "bg-slate-100 text-slate-800 border-slate-300 focus:ring-slate-400";
      default:
        return "bg-slate-50 text-slate-800 border-slate-200 focus:ring-emerald-500";
    }
  };

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <select
        value={localStatus}
        disabled={isPending}
        onChange={(e) => {
          const val = e.target.value as "scheduled" | "completed" | "missed" | "skipped";
          setLocalStatus(val); // optimistic update
          startTransition(async () => {
            const result = await updatePickupStatus(pickupId, val);
            if (!result.success) {
              setLocalStatus(current); // rollback on error
              onResult(result.error ?? "Failed.", true);
            }
          });
        }}
        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold capitalize transition-all cursor-pointer focus:outline-none focus:ring-2 ${getStatusStyles(
          localStatus
        )} ${isPending ? "opacity-60 pointer-events-none" : ""}`}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s} className="bg-white text-slate-800 font-medium capitalize">
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>
      {isPending && <Loader2 className="h-3 w-3 animate-spin text-slate-400" />}
    </div>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

type Tab = "schedules" | "pickups";

export function SchedulesClient({
  schedules,
  categories,
  pickups,
  addresses,
  barangays,
  initialTab = "schedules",
  initialAction = null,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [showCreateSched, setShowCreateSched] = useState(initialAction === "new");
  const [showCreatePickup, setShowCreatePickup] = useState(false);
  const [editSched, setEditSched] = useState<AdminSchedule | null>(null);
  const [deleteSched, setDeleteSched] = useState<string | null>(null);
  const [deletePickupId, setDeletePickupId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Pickup Filters
  const [pickupSearch, setPickupSearch] = useState("");
  const [pickupStatusFilter, setPickupStatusFilter] = useState("all");
  const [pickupCategoryFilter, setPickupCategoryFilter] = useState("all");

  // Schedule Filters
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [scheduleBarangayFilter, setScheduleBarangayFilter] = useState("all");
  const [scheduleCategoryFilter, setScheduleCategoryFilter] = useState("all");
  const [scheduleDayFilter, setScheduleDayFilter] = useState("all");
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredSchedules = schedules.filter((s) => {
    // Barangay filter
    if (scheduleBarangayFilter !== "all") {
      if (scheduleBarangayFilter === "citywide" && s.barangay_id) return false;
      if (scheduleBarangayFilter !== "citywide" && s.barangay_id !== scheduleBarangayFilter) return false;
    }
    // Category filter
    if (scheduleCategoryFilter !== "all" && s.waste_category_id !== scheduleCategoryFilter) {
      return false;
    }
    // Day filter
    if (scheduleDayFilter !== "all") {
      if (s.day_of_week === null || s.day_of_week.toString() !== scheduleDayFilter) {
        return false;
      }
    }
    // Status filter
    if (scheduleStatusFilter !== "all") {
      if (scheduleStatusFilter === "active" && !s.is_active) return false;
      if (scheduleStatusFilter === "inactive" && s.is_active) return false;
    }
    // Keyword search
    if (scheduleSearch.trim()) {
      const q = scheduleSearch.toLowerCase();
      const matchBarangay = s.barangay_name.toLowerCase().includes(q);
      const matchCategory = s.category_name.toLowerCase().includes(q);
      const matchDay = s.day_of_week !== null && DAYS[s.day_of_week].toLowerCase().includes(q);
      const matchTime = s.collection_time.toLowerCase().includes(q);
      if (!matchBarangay && !matchCategory && !matchDay && !matchTime) return false;
    }
    return true;
  });

  const filteredPickups = pickups.filter((p) => {
    // Status filter
    if (pickupStatusFilter !== "all" && p.status !== pickupStatusFilter) {
      return false;
    }
    // Category filter
    if (pickupCategoryFilter !== "all" && p.waste_category.id !== pickupCategoryFilter) {
      return false;
    }
    // Search query
    if (!pickupSearch.trim()) return true;
    const q = pickupSearch.toLowerCase();
    return (
      p.address.street.toLowerCase().includes(q) ||
      p.address.city.toLowerCase().includes(q) ||
      p.waste_category.name.toLowerCase().includes(q) ||
      p.scheduled_date.includes(q) ||
      p.status.toLowerCase().includes(q)
    );
  });

  // Group filtered schedules by barangay
  const groupedByBarangay = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        isCityWide: boolean;
        schedules: AdminSchedule[];
        activeCount: number;
      }
    >();

    for (const s of filteredSchedules) {
      const key = s.barangay_id ?? "citywide";
      const name = s.barangay_id ? s.barangay_name : "City-wide (All Barangays)";
      const isCityWide = !s.barangay_id;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name,
          isCityWide,
          schedules: [],
          activeCount: 0,
        });
      }
      const group = map.get(key)!;
      group.schedules.push(s);
      if (s.is_active) {
        group.activeCount += 1;
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.isCityWide) return -1;
      if (b.isCityWide) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredSchedules]);

  // Expand / collapse state for barangay groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const isGroupExpanded = (key: string) => {
    // If the admin enters a search query, expand matching groups automatically
    if (scheduleSearch.trim().length > 0) {
      return expandedGroups[key] !== false;
    }
    return !!expandedGroups[key];
  };

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !isGroupExpanded(key),
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    for (const g of groupedByBarangay) {
      next[g.id] = true;
    }
    setExpandedGroups(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    for (const g of groupedByBarangay) {
      next[g.id] = false;
    }
    setExpandedGroups(next);
  };

  const handleMsg = (msg: string, isError: boolean) => {
    if (isError) setErrorMsg(msg);
    else setSuccessMsg(msg);
  };

  const handleDeleteSched = async (id: string) => {
    const result = await deleteSchedule(id);
    if (result.success) setSuccessMsg("Schedule deleted.");
    else setErrorMsg(result.error ?? "Failed.");
    setDeleteSched(null);
  };

  const handleDeletePickup = async (id: string) => {
    const result = await deletePickup(id);
    if (result.success) setSuccessMsg("Pickup removed.");
    else setErrorMsg(result.error ?? "Failed.");
    setDeletePickupId(null);
  };

  const clearScheduleFilters = () => {
    setScheduleSearch("");
    setScheduleBarangayFilter("all");
    setScheduleCategoryFilter("all");
    setScheduleDayFilter("all");
    setScheduleStatusFilter("all");
  };

  const clearPickupFilters = () => {
    setPickupSearch("");
    setPickupStatusFilter("all");
    setPickupCategoryFilter("all");
  };

  return (
    <div>
      <PageHeader
        title="Schedules & Pickups"
        subtitle="Manage collection schedules and track garbage pickups."
        action={
          <button
            onClick={() => tab === "schedules" ? setShowCreateSched(true) : setShowCreatePickup(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {tab === "schedules" ? "New Schedule" : "Add Pickup Record"}
          </button>
        }
      />

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />}
      {errorMsg && <Alert type="error" message={errorMsg} onDismiss={() => setErrorMsg("")} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-200 rounded-xl p-1 mb-6 w-fit">
        {(["schedules", "pickups"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize cursor-pointer ${
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "schedules" ? <CalendarClock className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
            {t === "schedules" ? `Collection Schedules (${schedules.length})` : `Pickup Records (${pickups.length})`}
          </button>
        ))}
      </div>

      {/* ─ Schedules Tab ─ */}
      {tab === "schedules" && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500">
            Manage recurring collection days, times, and waste categories.
          </p>

          {schedules.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No collection schedules"
              subtitle='Create a collection schedule, then use "Generate" to create pickup records for all active addresses.'
              action={
                <button
                  onClick={() => setShowCreateSched(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Schedule
                </button>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Comprehensive Filter Bar */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search barangay (e.g. Ampayon, Libertad), category, day…"
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      Showing <strong className="text-slate-800">{filteredSchedules.length}</strong> of {schedules.length} schedules
                    </span>
                    {(scheduleSearch || scheduleBarangayFilter !== "all" || scheduleCategoryFilter !== "all" || scheduleDayFilter !== "all" || scheduleStatusFilter !== "all") && (
                      <button
                        type="button"
                        onClick={clearScheduleFilters}
                        className="text-emerald-700 font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  {/* Filter by Barangay */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Barangay
                    </label>
                    <select
                      value={scheduleBarangayFilter}
                      onChange={(e) => setScheduleBarangayFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Barangays</option>
                      <option value="citywide">City-wide (All Barangays)</option>
                      {barangays.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Waste Category */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Waste Category
                    </label>
                    <select
                      value={scheduleCategoryFilter}
                      onChange={(e) => setScheduleCategoryFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Day */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Collection Day
                    </label>
                    <select
                      value={scheduleDayFilter}
                      onChange={(e) => setScheduleDayFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Days</option>
                      {DAYS.map((d, i) => (
                        <option key={i} value={i.toString()}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filter by Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Status
                    </label>
                    <select
                      value={scheduleStatusFilter}
                      onChange={(e) => setScheduleStatusFilter(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredSchedules.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">No schedules match your filter criteria.</p>
                  <p className="text-xs text-slate-400 mt-1">Try resetting your filters or create a new schedule rule.</p>
                  <button
                    onClick={clearScheduleFilters}
                    className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Quick Toolbar: Barangay Group Summary & Expand/Collapse Controls */}
                  <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">
                        {groupedByBarangay.length} {groupedByBarangay.length === 1 ? "Barangay Group" : "Barangay Groups"}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 font-medium">
                        {filteredSchedules.length} collection {filteredSchedules.length === 1 ? "rule" : "rules"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={expandAll}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                      >
                        Expand All
                      </button>
                      <button
                        type="button"
                        onClick={collapseAll}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                      >
                        Collapse All
                      </button>
                    </div>
                  </div>

                  {/* ─── 2. Independent Vertical Scrollable Grouped Container (max-h-[500px]) ─── */}
                  <div
                    id="barangay-schedules-scroll-container"
                    className="max-h-[500px] overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-slate-100"
                    style={{ overscrollBehaviorY: "contain" }}
                  >
                    {groupedByBarangay.map((group) => {
                      const isExpanded = isGroupExpanded(group.id);
                      return (
                        <div key={group.id} className="bg-white">
                          {/* Barangay Accordion Header */}
                          <button
                            type="button"
                            onClick={() => toggleGroup(group.id)}
                            aria-expanded={isExpanded}
                            className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left hover:bg-slate-50/80 transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                              <div
                                className={`p-1 rounded-lg text-slate-400 group-hover:text-emerald-600 transition-all ${
                                  isExpanded ? "rotate-90 text-emerald-600 bg-emerald-50" : ""
                                }`}
                              >
                                <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                              </div>

                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <MapPin className="h-3.5 w-3.5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                                    {group.name}
                                  </span>
                                  {group.isCityWide && (
                                    <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                      City-wide
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                                {group.schedules.length} {group.schedules.length === 1 ? "schedule" : "schedules"}
                              </span>
                              <span
                                className={`text-[10px] font-medium hidden sm:inline ${
                                  group.activeCount > 0 ? "text-emerald-600 font-semibold" : "text-slate-400"
                                }`}
                              >
                                {group.activeCount} active
                              </span>
                            </div>
                          </button>

                          {/* Barangay Schedules Content when Expanded */}
                          {isExpanded && (
                            <div className="bg-slate-50/70 border-t border-slate-100 p-2 sm:p-3">
                              {/* Desktop Table View */}
                              <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200/80">
                                      <th className="text-left px-3 py-2">Waste Category</th>
                                      <th className="text-left px-3 py-2">Day & Time</th>
                                      <th className="text-left px-3 py-2">Frequency</th>
                                      <th className="text-left px-3 py-2">Status</th>
                                      <th className="text-left px-3 py-2">Period</th>
                                      <th className="text-right px-3 py-2">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200/60">
                                    {group.schedules.map((s) => (
                                      <tr key={s.id} className="hover:bg-white/80 transition-colors">
                                        {/* Waste Category */}
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                          <span
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5"
                                            style={{
                                              backgroundColor: s.category_color ? `${s.category_color}22` : "#f1f5f9",
                                              color: s.category_color ?? "#475569",
                                              border: `1px solid ${s.category_color ? `${s.category_color}44` : "#e2e8f0"}`,
                                            }}
                                          >
                                            <span
                                              className="h-2 w-2 rounded-full"
                                              style={{ backgroundColor: s.category_color ?? "#64748b" }}
                                            />
                                            {s.category_name}
                                          </span>
                                        </td>

                                        {/* Day & Time */}
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                          <p className="font-bold text-slate-800 text-xs">
                                            {s.day_of_week !== null ? DAYS[s.day_of_week] : "Any day"}
                                          </p>
                                          <p className="text-[11px] text-slate-500">{s.collection_time}</p>
                                        </td>

                                        {/* Frequency */}
                                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                                          {FREQ_LABELS[s.frequency] ?? s.frequency}
                                        </td>

                                        {/* Status Toggle */}
                                        <td className="px-3 py-2.5 whitespace-nowrap">
                                          <ToggleActiveButton
                                            scheduleId={s.id}
                                            isActive={s.is_active}
                                            onResult={handleMsg}
                                          />
                                        </td>

                                        {/* Period */}
                                        <td className="px-3 py-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                                          {formatDate(s.start_date)}
                                          {s.end_date ? ` → ${formatDate(s.end_date)}` : " → ongoing"}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-3 py-2.5 whitespace-nowrap text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <GeneratePickupsButton
                                              scheduleId={s.id}
                                              onResult={handleMsg}
                                            />
                                            <NotifyButton
                                              onResult={handleMsg}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => setEditSched(s)}
                                              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                                              title="Edit Schedule"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setDeleteSched(s.id)}
                                              className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-transparent hover:border-red-100"
                                              title="Delete Schedule"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile Card View */}
                              <div className="md:hidden space-y-2">
                                {group.schedules.map((s) => (
                                  <div
                                    key={s.id}
                                    className="bg-white rounded-xl border border-slate-200/80 p-3 space-y-2.5 shadow-2xs"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <span
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-0.5"
                                        style={{
                                          backgroundColor: s.category_color ? `${s.category_color}22` : "#f1f5f9",
                                          color: s.category_color ?? "#475569",
                                          border: `1px solid ${s.category_color ? `${s.category_color}44` : "#e2e8f0"}`,
                                        }}
                                      >
                                        <span
                                          className="h-2 w-2 rounded-full"
                                          style={{ backgroundColor: s.category_color ?? "#64748b" }}
                                        />
                                        {s.category_name}
                                      </span>
                                      <ToggleActiveButton
                                        scheduleId={s.id}
                                        isActive={s.is_active}
                                        onResult={handleMsg}
                                      />
                                    </div>

                                    <div className="text-xs space-y-0.5 text-slate-600">
                                      <p className="font-semibold text-slate-900">
                                        {s.day_of_week !== null ? DAYS[s.day_of_week] : "Any day"} · {s.collection_time}
                                      </p>
                                      <p className="text-[11px] text-slate-500">
                                        Frequency: {FREQ_LABELS[s.frequency] ?? s.frequency}
                                      </p>
                                      <p className="text-[11px] text-slate-400">
                                        {formatDate(s.start_date)}{s.end_date ? ` → ${formatDate(s.end_date)}` : " (ongoing)"}
                                      </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1 flex-wrap">
                                      <div className="flex items-center gap-1">
                                        <GeneratePickupsButton scheduleId={s.id} onResult={handleMsg} />
                                        <NotifyButton onResult={handleMsg} />
                                      </div>
                                      <div className="flex items-center gap-1 ml-auto">
                                        <button
                                          type="button"
                                          onClick={() => setEditSched(s)}
                                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                                          title="Edit"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeleteSched(s.id)}
                                          className="p-1.5 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                                          title="Delete"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Info Footer */}
                  <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>
                      Showing {groupedByBarangay.length} barangay {groupedByBarangay.length === 1 ? "group" : "groups"} ({filteredSchedules.length} schedules total)
                    </span>
                    <span className="text-slate-400 hidden sm:inline">
                      Scroll to browse all 86 barangays
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─ Pickups Tab ─ */}
      {tab === "pickups" && (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500">
            View individual garbage pickups and update their collection status.
          </p>

          {pickups.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No pickup records"
              subtitle='Create a collection schedule and click "Generate" to auto-create pickups, or add individual pickup records manually.'
              action={
                <button
                  onClick={() => setShowCreatePickup(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Pickup Record
                </button>
              }
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Comprehensive Filter Bar */}
              <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search pickups by address, category, date, or status…"
                      value={pickupSearch}
                      onChange={(e) => setPickupSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>
                        Showing <strong className="text-slate-800">{filteredPickups.length}</strong> of {pickups.length} pickups
                      </span>
                      {(pickupSearch || pickupStatusFilter !== "all" || pickupCategoryFilter !== "all") && (
                        <button
                          type="button"
                          onClick={clearPickupFilters}
                          className="text-emerald-700 font-semibold hover:underline cursor-pointer ml-1"
                        >
                          Reset filters
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCreatePickup(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Pickup Record
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {/* Filter by Status */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Status
                    </label>
                    <select
                      value={pickupStatusFilter}
                      onChange={(e) => setPickupStatusFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="missed">Missed</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </div>

                  {/* Filter by Waste Category */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Waste Category
                    </label>
                    <select
                      value={pickupCategoryFilter}
                      onChange={(e) => setPickupCategoryFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {filteredPickups.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={ListChecks}
                    title="No matching pickups"
                    subtitle={
                      pickupSearch || pickupStatusFilter !== "all" || pickupCategoryFilter !== "all"
                        ? "No pickup records match the current filters."
                        : "No pickup events recorded."
                    }
                    action={
                      pickupSearch || pickupStatusFilter !== "all" || pickupCategoryFilter !== "all" ? (
                        <button
                          onClick={clearPickupFilters}
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                        >
                          Reset filters
                        </button>
                      ) : undefined
                    }
                  />
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto subtle-scrollbar">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-xs">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Address</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Category</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                        <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPickups.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <CalendarClock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{formatDate(p.scheduled_date)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 font-medium">{p.address.street}</p>
                            <p className="text-xs text-slate-500">{p.address.city} {p.address.postal_code}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5"
                              style={{
                                backgroundColor: p.waste_category.color_code ? `${p.waste_category.color_code}22` : "#f1f5f9",
                                color: p.waste_category.color_code ?? "#475569",
                                border: `1px solid ${p.waste_category.color_code ? `${p.waste_category.color_code}44` : "#e2e8f0"}`,
                              }}
                            >
                              {p.waste_category.name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <PickupStatusSelect
                              pickupId={p.id}
                              current={p.status}
                              onResult={handleMsg}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setDeletePickupId(p.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {pickups.length >= 100 && (
                <div className="px-4 py-3 text-xs text-center text-slate-400 border-t border-slate-100 bg-slate-50">
                  Showing first 100 records. Use search or filters above to narrow down.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateSched && (
        <Modal title="New Schedule" subtitle="Define a recurring collection schedule for the municipality" onClose={() => setShowCreateSched(false)} wide>
          <ScheduleForm categories={categories} barangays={barangays} onClose={() => setShowCreateSched(false)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {editSched && (
        <Modal title="Edit Schedule" subtitle={editSched.category_name} onClose={() => setEditSched(null)} wide>
          <ScheduleForm initial={editSched} categories={categories} barangays={barangays} onClose={() => setEditSched(null)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {showCreatePickup && (
        <Modal title="Add Pickup Record" subtitle="Create a single pickup record for an address" onClose={() => setShowCreatePickup(false)} wide>
          <PickupForm addresses={addresses} categories={categories} onClose={() => setShowCreatePickup(false)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {deleteSched && (
        <ConfirmDialog
          title="Delete Schedule"
          message="This will soft-delete the recurring schedule. Already-generated pickup records are not affected."
          confirmLabel="Delete Schedule"
          onConfirm={() => handleDeleteSched(deleteSched)}
          onCancel={() => setDeleteSched(null)}
        />
      )}

      {deletePickupId && (
        <ConfirmDialog
          title="Remove Pickup Record"
          message="This pickup record will be removed from the resident's schedule. This cannot be undone easily."
          confirmLabel="Remove Pickup Record"
          onConfirm={() => handleDeletePickup(deletePickupId)}
          onCancel={() => setDeletePickupId(null)}
        />
      )}
    </div>
  );
}
