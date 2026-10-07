"use client";

import { useState, useTransition } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import type { AdminZone } from "@/app/actions/admin";
import { createZone, updateZone, deleteZone } from "@/app/actions/admin";
import {
  Alert,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SubmitButton,
  Textarea,
} from "../ui";

function ZoneForm({
  initial,
  onClose,
  onSuccess,
}: {
  initial?: AdminZone;
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
      const result = initial ? await updateZone(initial.id, fd) : await createZone(fd);
      if (result.success) {
        onSuccess(initial ? "Zone updated." : "Zone created.");
        onClose();
      } else {
        setError(result.error ?? "Failed.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Zone Name" required>
        <Input name="name" placeholder="e.g. North District" defaultValue={initial?.name ?? ""} required />
      </Field>
      <Field label="Description">
        <Textarea
          name="description"
          placeholder="Optional notes about this zone"
          defaultValue={initial?.description ?? ""}
          rows={3}
        />
      </Field>
      {error && <Alert type="error" message={error} />}
      <SubmitButton loading={isPending} label={initial ? "Update Zone" : "Create Zone"} onCancel={onClose} />
    </form>
  );
}

export function ZonesClient({ zones: initialZones }: { zones: AdminZone[] }) {
  const [zones, setZones] = useState(initialZones);
  const [showCreate, setShowCreate] = useState(false);
  const [editZone, setEditZone] = useState<AdminZone | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSuccess = (msg: string) => {
    setSuccessMsg(msg);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteZone(id);
    if (result.success) {
      setZones((prev) => prev.filter((z) => z.id !== id));
      setSuccessMsg("Zone deleted.");
      setDeleteId(null);
    } else {
      setErrorMsg(result.error ?? "Failed to delete zone.");
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Collection Zones"
        subtitle={`${zones.length} zone${zones.length !== 1 ? "s" : ""}`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Zone
          </button>
        }
      />

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />}
      {errorMsg && <Alert type="error" message={errorMsg} onDismiss={() => setErrorMsg("")} />}

      {zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No zones yet"
          subtitle="Create your first collection zone to get started."
          action={
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Create Zone
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900">{zone.name}</h3>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setEditZone(zone)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(zone.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {zone.description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{zone.description}</p>
              )}

              <div className="flex gap-4 text-xs text-slate-500">
                <span>{zone.address_count} address{zone.address_count !== 1 ? "es" : ""}</span>
                <span>{zone.schedule_count} schedule{zone.schedule_count !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <Modal title="Create Zone" subtitle="Add a new collection zone" onClose={() => setShowCreate(false)}>
          <ZoneForm onClose={() => setShowCreate(false)} onSuccess={handleSuccess} />
        </Modal>
      )}

      {editZone && (
        <Modal title="Edit Zone" subtitle={editZone.name} onClose={() => setEditZone(null)}>
          <ZoneForm initial={editZone} onClose={() => setEditZone(null)} onSuccess={handleSuccess} />
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete Zone"
          message="This will soft-delete the zone. Zones with linked addresses or schedules cannot be deleted."
          confirmLabel="Delete Zone"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
