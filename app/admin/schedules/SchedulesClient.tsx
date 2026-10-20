"use client";

import { useState, useTransition } from "react";
import {
  Bell,
  CalendarClock,
  ListChecks,
  Loader2,
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
              <span className="font-semibold text-slate-800">Active Rule</span>
              <p className="text-slate-500">
                Active rules appear on public schedules and generate recurring pickups for addresses. Deactivating pauses generation safely without deleting past records.
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
      title={isActive ? "Click to deactivate rule" : "Click to activate rule"}
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
        onSuccess("Pickup event created.");
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
      <SubmitButton loading={isPending} label="Create Pickup" onCancel={onClose} />
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

  return (
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
      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

// ─── Main Client ──────────────────────────────────────────────────────────────

type Tab = "schedules" | "pickups";

export function SchedulesClient({ schedules, categories, pickups, addresses, barangays }: Props) {
  const [tab, setTab] = useState<Tab>("schedules");
  const [showCreateSched, setShowCreateSched] = useState(false);
  const [showCreatePickup, setShowCreatePickup] = useState(false);
  const [editSched, setEditSched] = useState<AdminSchedule | null>(null);
  const [deleteSched, setDeleteSched] = useState<string | null>(null);
  const [deletePickupId, setDeletePickupId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");

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

  return (
    <div>
      <PageHeader
        title="Schedules & Pickups"
        subtitle="Manage recurring collection rules and individual pickup events"
        action={
          <button
            onClick={() => tab === "schedules" ? setShowCreateSched(true) : setShowCreatePickup(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            {tab === "schedules" ? "New Schedule" : "New Pickup"}
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
            {t === "schedules" ? `Rules (${schedules.length})` : `Events (${pickups.length})`}
          </button>
        ))}
      </div>

      {/* ─ Schedules Tab ─ */}
      {tab === "schedules" && (
        <>
          {schedules.length === 0 ? (
            <EmptyState
              icon={CalendarClock}
              title="No schedule rules"
              subtitle='Create a recurring rule, then use "Generate" to create pickup events for all active addresses.'
              action={
                <button
                  onClick={() => setShowCreateSched(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Create Rule
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
                      placeholder="Search schedules by barangay, category, day, time…"
                      value={scheduleSearch}
                      onChange={(e) => setScheduleSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>
                      Showing <strong className="text-slate-800">{filteredSchedules.length}</strong> of {schedules.length} rules
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
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Scope / Barangay</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Frequency</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Day & Time</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Period</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredSchedules.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">
                            {s.barangay_id ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-slate-700">
                                {s.barangay_name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-emerald-800">
                                City-wide (All)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5"
                              style={{
                                backgroundColor: s.category_color ? `${s.category_color}22` : "#f1f5f9",
                                color: s.category_color ?? "#475569",
                                border: `1px solid ${s.category_color ? `${s.category_color}44` : "#e2e8f0"}`,
                              }}
                            >
                              {s.category_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{FREQ_LABELS[s.frequency] ?? s.frequency}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">
                              {s.day_of_week !== null ? DAYS[s.day_of_week] : "Any day"}
                            </p>
                            <p className="text-[11px] text-slate-500">{s.collection_time}</p>
                          </td>
                          <td className="px-4 py-3">
                            <ToggleActiveButton
                              scheduleId={s.id}
                              isActive={s.is_active}
                              onResult={handleMsg}
                            />
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {formatDate(s.start_date)}
                            {s.end_date ? ` → ${formatDate(s.end_date)}` : " → ongoing"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <GeneratePickupsButton
                                scheduleId={s.id}
                                onResult={handleMsg}
                              />
                              <NotifyButton
                                onResult={handleMsg}
                              />
                              <button
                                onClick={() => setEditSched(s)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteSched(s.id)}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Delete"
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
              )}
            </div>
          )}
        </>
      )}

      {/* ─ Pickups Tab ─ */}
      {tab === "pickups" && (
        <>
          {pickups.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No pickup events"
              subtitle='Create a schedule rule above and click "Generate" to auto-create events, or add individual events manually.'
              action={
                <button
                  onClick={() => setShowCreatePickup(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Pickup
                </button>
              }
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative max-w-sm flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search pickups by address, category, date…"
                    value={pickupSearch}
                    onChange={(e) => setPickupSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  onClick={() => setShowCreatePickup(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Pickup
                </button>
              </div>

              {filteredPickups.length === 0 ? (
                <div className="p-8">
                  <EmptyState
                    icon={ListChecks}
                    title="No matching pickups"
                    subtitle={`No pickups match "${pickupSearch}".`}
                    action={
                      <button
                        onClick={() => setPickupSearch("")}
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Clear search
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Address</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                        <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredPickups.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                          {formatDate(p.scheduled_date)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800">{p.address.street}</p>
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
              <div className="px-4 py-3 text-xs text-center text-slate-400 border-t border-slate-100">
                Showing first 100 events. Use search or filter to narrow down.
              </div>
            )}
          </div>
        )}
      </>
    )}

      {/* Modals */}
      {showCreateSched && (
        <Modal title="New Schedule Rule" subtitle="Define a recurring collection rule for the municipality" onClose={() => setShowCreateSched(false)} wide>
          <ScheduleForm categories={categories} barangays={barangays} onClose={() => setShowCreateSched(false)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {editSched && (
        <Modal title="Edit Schedule Rule" subtitle={editSched.category_name} onClose={() => setEditSched(null)} wide>
          <ScheduleForm initial={editSched} categories={categories} barangays={barangays} onClose={() => setEditSched(null)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {showCreatePickup && (
        <Modal title="Add Pickup Event" subtitle="Create a single pickup event for an address" onClose={() => setShowCreatePickup(false)} wide>
          <PickupForm addresses={addresses} categories={categories} onClose={() => setShowCreatePickup(false)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {deleteSched && (
        <ConfirmDialog
          title="Delete Schedule Rule"
          message="This will soft-delete the recurring rule. Already-generated pickup events are not affected."
          confirmLabel="Delete Rule"
          onConfirm={() => handleDeleteSched(deleteSched)}
          onCancel={() => setDeleteSched(null)}
        />
      )}

      {deletePickupId && (
        <ConfirmDialog
          title="Remove Pickup Event"
          message="This pickup will be removed from the resident's schedule. This cannot be undone easily."
          confirmLabel="Remove Pickup"
          onConfirm={() => handleDeletePickup(deletePickupId)}
          onCancel={() => setDeletePickupId(null)}
        />
      )}
    </div>
  );
}
