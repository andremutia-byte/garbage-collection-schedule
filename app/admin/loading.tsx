import { Recycle } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-36 bg-slate-200 rounded-lg" />
            <div className="h-5 w-32 bg-emerald-100 rounded-full" />
          </div>
          <div className="mt-2 h-4 w-80 bg-slate-200 rounded-md" />
        </div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs w-fit">
          <Recycle className="h-4 w-4 animate-spin [animation-duration:2s]" />
          <span>Loading ButuanLinis Admin…</span>
        </div>
      </div>

      {/* 5 Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3"
          >
            <div className="h-3 w-20 bg-slate-200 rounded" />
            <div className="h-8 w-16 bg-slate-300 rounded" />
            <div className="h-3 w-24 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Reports Card Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="h-5 w-44 bg-slate-200 rounded" />
        <div className="h-3 w-full bg-slate-100 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
          <div className="h-40 bg-slate-50 rounded-xl border border-slate-100" />
          <div className="h-40 bg-slate-50 rounded-xl border border-slate-100" />
        </div>
      </div>
    </div>
  );
}
