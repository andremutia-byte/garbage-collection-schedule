import { Recycle } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="relative mb-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 animate-pulse">
          <Recycle className="h-8 w-8 animate-spin [animation-duration:3s]" />
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        ButuanLinis
      </h2>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium max-w-sm">
        “A Cleaner Butuan, One Collection at a Time.”
      </p>

      <div className="mt-8 flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]" />
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]" />
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-bounce" />
      </div>
    </div>
  );
}
