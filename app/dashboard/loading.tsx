import { Recycle } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-44 rounded-xl bg-slate-200" />
          <div className="mt-2 h-4 w-72 rounded-lg bg-slate-100" />
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 w-fit">
          <Recycle className="h-3.5 w-3.5 animate-spin [animation-duration:2s]" />
          <span>Syncing ButuanLinis Schedule…</span>
        </div>
      </div>

      {/* Hero Banner Skeleton */}
      <div className="rounded-2xl bg-slate-200 h-28 w-full" />

      {/* Grid Content Skeleton */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column (Addresses & Notifications) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-5 w-32 bg-slate-200 rounded" />
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-20 bg-slate-100 rounded-xl" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column (Upcoming Pickups) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 bg-slate-200 rounded" />
            <div className="h-5 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-20 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-20 bg-white border border-slate-200 rounded-2xl" />
            <div className="h-20 bg-white border border-slate-200 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
