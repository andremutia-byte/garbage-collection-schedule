"use client";

import { useState, useTransition } from "react";
import { Home, MapPin, Pencil, Search } from "lucide-react";
import type { AdminAddress, AdminZone } from "@/app/actions/admin";
import { updateAddressZone, adminDeleteAddress } from "@/app/actions/admin";
import {
  Alert,
  Badge,
  ConfirmDialog,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  SubmitButton,
} from "../ui";

interface Props {
  addresses: AdminAddress[];
  zones: AdminZone[];
}

function EditZoneModal({
  address,
  zones,
  onClose,
  onSuccess,
}: {
  address: AdminAddress;
  zones: AdminZone[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const zoneId = (fd.get("zone_id") as string) || null;
    startTransition(async () => {
      const result = await updateAddressZone(address.id, zoneId);
      if (result.success) {
        onSuccess("Address zone updated successfully.");
        onClose();
      } else {
        setError(result.error ?? "Failed to update.");
      }
    });
  };

  return (
    <Modal title="Assign Zone" subtitle={`${address.street}, ${address.city}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Collection Zone">
          <Select name="zone_id" defaultValue={address.zone_id ?? ""}>
            <option value="">— Unassigned —</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </Select>
        </Field>
        {error && <Alert type="error" message={error} />}
        <SubmitButton loading={isPending} label="Update Zone" onCancel={onClose} />
      </form>
    </Modal>
  );
}

export function AddressesClient({ addresses: initialAddresses, zones }: Props) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [search, setSearch] = useState("");
  const [editAddress, setEditAddress] = useState<AdminAddress | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const filtered = addresses.filter(
    (a) =>
      a.street.toLowerCase().includes(search.toLowerCase()) ||
      a.city.toLowerCase().includes(search.toLowerCase()) ||
      a.postal_code.includes(search) ||
      (a.zone_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const result = await adminDeleteAddress(id);
    if (result.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      setSuccessMsg("Address removed.");
      setDeleteId(null);
    } else {
      setErrorMsg(result.error ?? "Failed to delete.");
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Addresses"
        subtitle={`${addresses.length} registered address${addresses.length !== 1 ? "es" : ""}`}
      />

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />}
      {errorMsg && <Alert type="error" message={errorMsg} onDismiss={() => setErrorMsg("")} />}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by street, city, postal code or zone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Home}
              title="No addresses found"
              subtitle={search ? `No registered addresses match "${search}".` : "No addresses have been registered yet."}
              action={
                search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Clear search
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Address</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Zone</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Residents</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((addr) => (
                  <tr key={addr.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {addr.street}{addr.unit ? `, ${addr.unit}` : ""}
                      </p>
                      <p className="text-slate-500 text-xs">{addr.city} {addr.postal_code}</p>
                    </td>
                    <td className="px-4 py-3">
                      {addr.zone_name ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                          <MapPin className="h-3 w-3" /> {addr.zone_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{addr.resident_count}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditAddress(addr)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Zone
                        </button>
                        <button
                          onClick={() => setDeleteId(addr.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 transition-colors"
                        >
                          Remove
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

      {editAddress && (
        <EditZoneModal
          address={editAddress}
          zones={zones}
          onClose={() => setEditAddress(null)}
          onSuccess={(msg) => setSuccessMsg(msg)}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Remove Address"
          message="This will soft-delete the address. Residents linked to it will lose their schedule. Are you sure?"
          confirmLabel="Remove"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
