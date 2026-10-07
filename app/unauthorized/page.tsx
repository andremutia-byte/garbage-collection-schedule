import Link from "next/link";
import { ArrowLeft, Home, ShieldX } from "lucide-react";

export const metadata = { title: "Unauthorized — GCS" };

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-xs">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Access Restricted</h1>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          You do not have administrative authorization to view the control panel. Only accounts with the <strong className="font-semibold text-slate-800">admin</strong> role are granted access to administrative management.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            My Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
