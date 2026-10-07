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
  AdminZone,
  AdminCategory,
  AdminPickup,
} from "@/app/actions/admin";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
  generatePickupsFromSchedule,
  createPickup,
  updatePickupStatus,
  deletePickup,
} from "@/app/actions/admin";
import { generatePickupReminders } from "@/app/actions/notifications";
import {
  Alert,
  Badge,
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
  zone_name: string | null;
}

interface Props {
  schedules: AdminSchedule[];
  zones: AdminZone[];
  categories: AdminCategory[];
  pickups: AdminPickup[];
  addresses: AddressItem[];
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

function statusBadgeVariant(s: string) {
  if (s === "completed") return "success";
  if (s === "missed" || s === "skipped") return "danger";
  return "default";
}

// ─── Schedule Form ────────────────────────────────────────────────────────────

function ScheduleForm({
  initial,
  zones,
  categories,
  onClose,
  onSuccess,
}: {
  initial?: AdminSchedule;
  zones: AdminZone[];
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Zone" required>
          <Select name="zone_id" defaultValue={initial?.zone_id ?? ""} required>
            <option value="">Select zone…</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </Select>
        </Field>
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
              {a.label}{a.zone_name ? ` [${a.zone_name}]` : ""}
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
      title="Generate pickup events from this schedule"
      className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 transition-colors"
    >
      {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
      Generate
    </button>
  );
}

// ─── Notify Residents Button ──────────────────────────────────────────────────

function NotifyButton({ zoneId, onResult }: { zoneId: string; onResult: (msg: string, isError: boolean) => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await generatePickupReminders(zoneId);
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
      title="Send pickup reminders to residents in this zone"
      className="inline-flex items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60 transition-colors"
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

export function SchedulesClient({ schedules, zones, categories, pickups, addresses }: Props) {
  const [tab, setTab] = useState<Tab>("schedules");
  const [showCreateSched, setShowCreateSched] = useState(false);
  const [showCreatePickup, setShowCreatePickup] = useState(false);
  const [editSched, setEditSched] = useState<AdminSchedule | null>(null);
  const [deleteSched, setDeleteSched] = useState<string | null>(null);
  const [deletePickupId, setDeletePickupId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pickupSearch, setPickupSearch] = useState("");

  const filteredPickups = pickups.filter((p) => {
    if (!pickupSearch.trim()) return true;
    const q = pickupSearch.toLowerCase();
    return (
      p.address.street.toLowerCase().includes(q) ||
      p.address.city.toLowerCase().includes(q) ||
      p.waste_category.name.toLowerCase().includes(q) ||
      (p.zone_name ?? "").toLowerCase().includes(q) ||
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

  return (
    <div>
      <PageHeader
        title="Schedules & Pickups"
        subtitle="Manage recurring collection rules and individual pickup events"
        action={
          <button
            onClick={() => tab === "schedules" ? setShowCreateSched(true) : setShowCreatePickup(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
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
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
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
              subtitle="Create a recurring rule, then use Generate to create pickup events for all addresses in that zone."
              action={
                <button
                  onClick={() => setShowCreateSched(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" /> Create Rule
                </button>
              }
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Zone</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Frequency</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Day</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-500">Period</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">{s.zone_name}</td>
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
                        <td className="px-4 py-3 text-slate-600">
                          {s.day_of_week !== null ? DAYS[s.day_of_week] : "—"}
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
                              zoneId={s.zone_id}
                              onResult={handleMsg}
                            />
                            <button
                              onClick={() => setEditSched(s)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteSched(s.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
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
                    placeholder="Search pickups by address, category, zone, date…"
                    value={pickupSearch}
                    onChange={(e) => setPickupSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>
                <button
                  onClick={() => setShowCreatePickup(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
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
                        className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
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
                        <th className="text-left px-4 py-3 font-medium text-slate-500">Zone</th>
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
                        <td className="px-4 py-3 text-slate-500 text-xs">{p.zone_name ?? "—"}</td>
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
                            className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <Modal title="New Schedule Rule" subtitle="Define a recurring collection rule for a zone" onClose={() => setShowCreateSched(false)} wide>
          <ScheduleForm zones={zones} categories={categories} onClose={() => setShowCreateSched(false)} onSuccess={(m) => setSuccessMsg(m)} />
        </Modal>
      )}

      {editSched && (
        <Modal title="Edit Schedule Rule" subtitle={`${editSched.zone_name} — ${editSched.category_name}`} onClose={() => setEditSched(null)} wide>
          <ScheduleForm initial={editSched} zones={zones} categories={categories} onClose={() => setEditSched(null)} onSuccess={(m) => setSuccessMsg(m)} />
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
