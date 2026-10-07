"use client";

import { useState, useTransition } from "react";
import { Users, Shield, ShieldOff, Search } from "lucide-react";
import type { AdminResident } from "@/app/actions/admin";
import { updateUserRole } from "@/app/actions/admin";
import { Alert, Badge, ConfirmDialog, EmptyState, PageHeader } from "../ui";

const ROLES = ["admin", "dispatcher", "collector", "resident"] as const;
type Role = typeof ROLES[number];

const roleBadgeVariant = (r: string) =>
  r === "admin" ? "admin" : r === "resident" ? "resident" : "default";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleToggle({ userId, currentRoles, role }: { userId: string; currentRoles: string[]; role: Role }) {
  const [isPending, startTransition] = useTransition();
  const has = currentRoles.includes(role);

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await updateUserRole(userId, role, has ? "remove" : "add");
        })
      }
      disabled={isPending}
      title={`${has ? "Remove" : "Add"} ${role} role`}
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors disabled:opacity-50 cursor-pointer ${
        has
          ? "bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
      }`}
    >
      {has ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
      {role}
    </button>
  );
}

export function ResidentsClient({ residents }: { residents: AdminResident[] }) {
  const [search, setSearch] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const filtered = residents.filter((r) =>
    r.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Residents"
        subtitle={`${residents.length} registered user${residents.length !== 1 ? "s" : ""}`}
      />

      {successMsg && (
        <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No residents found"
              subtitle={search ? `No accounts match "${search}".` : "No registered user accounts found."}
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
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Roles</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Addresses</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Notifications</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ROLES.map((role) => (
                          <RoleToggle key={role} userId={r.id} currentRoles={r.roles} role={role} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.address_count}</td>
                    <td className="px-4 py-3">
                      {r.notification_preference ? (
                        <Badge label={r.notification_preference} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
