"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Users,
  Shield,
  ShieldOff,
  Search,
  Phone,
  MapPin,
  Bell,
} from "lucide-react";
import type { AdminResident } from "@/app/actions/admin";
import { updateUserRole } from "@/app/actions/admin";
import { formatPhoneDisplay } from "@/lib/phone";
import { Alert, EmptyState, PageHeader } from "../ui";

const ROLES = ["admin", "dispatcher", "collector", "resident"] as const;
type Role = typeof ROLES[number];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleToggle({
  userId,
  currentRoles,
  role,
}: {
  userId: string;
  currentRoles: string[];
  role: Role;
}) {
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
          ? role === "admin"
            ? "bg-emerald-100 border-emerald-300 text-emerald-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            : role === "dispatcher"
            ? "bg-purple-100 border-purple-300 text-purple-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            : role === "collector"
            ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
            : "bg-blue-100 border-blue-300 text-blue-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700"
      }`}
    >
      {has ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
      <span className="capitalize">{role}</span>
    </button>
  );
}

export function ResidentsClient({ residents }: { residents: AdminResident[] }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addressFilter, setAddressFilter] = useState<"all" | "with_address" | "no_address">("all");
  const [successMsg, setSuccessMsg] = useState("");

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setAddressFilter("all");
  };

  const filtered = useMemo(() => {
    return residents.filter((r) => {
      // Role filter
      if (roleFilter !== "all" && !r.roles.includes(roleFilter)) {
        return false;
      }

      // Address filter
      if (addressFilter === "with_address" && r.address_count === 0) {
        return false;
      }
      if (addressFilter === "no_address" && r.address_count > 0) {
        return false;
      }

      // Search query
      const q = search.toLowerCase().trim();
      if (!q) return true;
      const cleanQ = q.replace(/[\s\-()]/g, "");
      const matchEmail = r.email.toLowerCase().includes(q);
      const cleanPhone = r.phone ? r.phone.replace(/[\s\-()]/g, "").toLowerCase() : "";
      const matchPhone = r.phone ? r.phone.toLowerCase().includes(q) || cleanPhone.includes(cleanQ) : false;
      const matchId = r.id.toLowerCase().includes(q);
      return matchEmail || matchPhone || matchId;
    });
  }, [residents, search, roleFilter, addressFilter]);

  const hasActiveFilters = search.trim() !== "" || roleFilter !== "all" || addressFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents"
        subtitle={`${residents.length} registered user account${residents.length !== 1 ? "s" : ""} in ButuanLinis`}
      />

      {successMsg && (
        <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg("")} />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter & Search Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by email, phone number, or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filtered.length}</strong> of {residents.length} residents
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-emerald-700 font-semibold hover:underline cursor-pointer ml-1"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* Filter by Role */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Filter by Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer capitalize"
              >
                <option value="all">All Roles</option>
                {ROLES.map((role) => (
                  <option key={role} value={role} className="capitalize">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Address Status */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Address Status
              </label>
              <select
                value={addressFilter}
                onChange={(e) => setAddressFilter(e.target.value as "all" | "with_address" | "no_address")}
                className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">All Residents</option>
                <option value="with_address">Has Registered Address (1+)</option>
                <option value="no_address">No Address Registered (0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No residents found"
              subtitle={
                hasActiveFilters
                  ? "No resident accounts match the selected filters."
                  : "No registered user accounts found in the database."
              }
              action={
                hasActiveFilters ? (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Reset filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="max-h-[520px] overflow-y-auto subtle-scrollbar overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/90 sticky top-0 z-10 border-b border-slate-200 backdrop-blur-xs">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Resident / Email
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Contact Number
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Assigned Roles
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Addresses
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Notifications
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => {
                  const initial = (r.email[0] || "U").toUpperCase();
                  const isAdmin = r.roles.includes("admin");

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              isAdmin
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : "bg-blue-100 text-blue-800 border border-blue-200"
                            }`}
                          >
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {r.email}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              ID: {r.id.slice(0, 12)}…
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {r.phone ? (
                          <div className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100/70 border border-slate-200/80 px-2.5 py-1 rounded-lg text-xs">
                            <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                            <span>{formatPhoneDisplay(r.phone)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Not provided</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {ROLES.map((role) => (
                            <RoleToggle
                              key={role}
                              userId={r.id}
                              currentRoles={r.roles}
                              role={role}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full ${
                            r.address_count > 0
                              ? "bg-slate-100 text-slate-700 border border-slate-200"
                              : "bg-slate-50 text-slate-400 border border-dashed border-slate-200"
                          }`}
                        >
                          <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>
                            {r.address_count} {r.address_count === 1 ? "address" : "addresses"}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.notification_preference ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                            <Bell className="h-3 w-3" />
                            {r.notification_preference}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Default</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {formatDate(r.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
