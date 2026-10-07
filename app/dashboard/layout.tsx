import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Recycle, Shield } from "lucide-react";
import { getAdminAuth } from "@/lib/admin-auth";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { isAdmin } = await getAdminAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <Recycle className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              GCS
            </span>
          </Link>

          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              My Schedule
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-xs"
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Panel
              </Link>
            )}
            <UserButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
