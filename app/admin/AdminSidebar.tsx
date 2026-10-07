"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Building2,
  CalendarClock,
  Home,
  MapPin,
  Menu,
  Recycle,
  Users,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { href: "/admin/residents", label: "Residents", icon: Users, exact: false },
  { href: "/admin/addresses", label: "Addresses", icon: Home, exact: false },
  { href: "/admin/zones", label: "Zones", icon: MapPin, exact: false },
  { href: "/admin/schedules", label: "Schedules", icon: CalendarClock, exact: false },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile Top Header (hidden on md and above) ── */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between bg-slate-900 px-4 py-3 text-white border-b border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500">
            <Recycle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">GCS Admin</p>
            <p className="text-[11px] text-slate-400 leading-tight">Control Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserButton />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Dropdown / Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 text-white px-4 py-3 border-b border-slate-800 space-y-1 z-30">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-600 text-white font-semibold"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 mt-3 border-t border-slate-800">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Building2 className="h-4 w-4" />
              Switch to Resident View
            </Link>
          </div>
        </div>
      )}

      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside className="hidden md:flex w-60 shrink-0 bg-slate-900 text-white flex-col min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 shadow-xs">
            <Recycle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight tracking-tight">GCS Admin</p>
            <p className="text-xs text-slate-400 leading-tight">Control Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom links */}
        <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-900/60">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Building2 className="h-3.5 w-3.5" />
            Switch to Resident View
          </Link>
          <div className="flex items-center gap-2.5 pt-1 border-t border-slate-800/60">
            <UserButton />
            <span className="text-xs text-slate-400">Account</span>
          </div>
        </div>
      </aside>
    </>
  );
}
