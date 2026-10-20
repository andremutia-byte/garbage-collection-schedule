"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Leaf,
  Loader2,
  Recycle,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { getBarangays, type BarangayItem } from "@/app/actions/barangays";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type BarangayOption = BarangayItem;

export default function Hero({
  initialBarangays = [],
}: {
  initialBarangays?: BarangayOption[];
}) {
  const router = useRouter();
  const [barangay, setBarangay] = useState("");
  const [barangayList, setBarangayList] = useState<BarangayOption[]>(initialBarangays);
  const [isLoading, setIsLoading] = useState(initialBarangays.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  const handleRetry = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getBarangays();
      if (data && data.length > 0) {
        setBarangayList(data);
        return;
      }

      const supabase = createBrowserSupabaseClient();
      const { data: clientData, error: clientError } = await supabase
        .from("barangays")
        .select("id, name")
        .order("name", { ascending: true });

      if (clientError) throw clientError;
      setBarangayList(clientData || []);
    } catch (err: unknown) {
      console.error("Failed to load barangays in Hero retry:", err);
      setError("Unable to load barangay list. Please check your connection and retry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (initialBarangays.length === 0) {
      getBarangays()
        .then((data) => {
          if (ignore) return;
          if (data && data.length > 0) {
            setBarangayList(data);
            setIsLoading(false);
          } else {
            const supabase = createBrowserSupabaseClient();
            Promise.resolve(
              supabase
                .from("barangays")
                .select("id, name")
                .order("name", { ascending: true })
            )
              .then(({ data: clientData, error: clientError }) => {
                if (ignore) return;
                if (clientError) throw clientError;
                setBarangayList(clientData || []);
                setIsLoading(false);
              })
              .catch((err: unknown) => {
                if (ignore) return;
                console.error("Fallback client fetch failed:", err);
                setError("Unable to load barangay list. Please check your connection and retry.");
                setIsLoading(false);
              });
          }
        })
        .catch((err: unknown) => {
          if (ignore) return;
          console.error("Failed to load barangays in Hero:", err);
          setError("Unable to load barangay list. Please check your connection and retry.");
          setIsLoading(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [initialBarangays]);

  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!barangay || isNavigating) return;
    startTransition(() => {
      router.push(`/schedule?barangay=${encodeURIComponent(barangay)}`);
    });
  }

  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
      {/* Left: copy + quick check */}
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          City of Butuan Waste Management
        </span>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
          Never Miss a <span className="text-emerald-600">Garbage Collection</span> Day in Butuan
        </h1>

        <p className="mt-4 text-lg font-semibold text-emerald-800">
          “A Cleaner Butuan, One Collection at a Time.”
        </p>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-slate-600">
          Check your barangay&apos;s waste and recycling schedule in seconds. Register your
          address once and we&apos;ll remind you before every pickup.
        </p>

        {/* Barangay Quick-Check Form */}
        <form
          onSubmit={handleCheck}
          className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row relative"
        >
          <label htmlFor="barangay" className="sr-only">
            Select your barangay
          </label>
          <div className="relative flex-1">
            <select
              id="barangay"
              value={barangay}
              onChange={(e) => setBarangay(e.target.value)}
              disabled={isLoading}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pr-10"
            >
              {isLoading ? (
                <option value="">Loading Butuan barangays…</option>
              ) : barangayList.length === 0 ? (
                <option value="">No barangays found</option>
              ) : (
                <option value="">Select your barangay…</option>
              )}
              {barangayList.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!barangay || isLoading || isNavigating}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer min-w-[170px]"
          >
            {isNavigating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              <>
                Check schedule <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Error notification if barangay query fails */}
        {error && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 max-w-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-1 font-semibold text-red-800 hover:underline cursor-pointer ml-3"
            >
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        )}

        {/* Subtext with Auth Registration guidance */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 max-w-xl">
          <span>
            {isLoading
              ? "Fetching Butuan City barangays…"
              : `Serving all ${barangayList.length || 86} barangays of Butuan City · Free for residents`}
          </span>
          <span className="text-slate-400">
            Want reminders?{" "}
            <Link
              href={
                barangay
                  ? `/schedule?barangay=${encodeURIComponent(barangay)}`
                  : "/schedule"
              }
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              View schedules & alert options
            </Link>
          </span>
        </div>
      </div>

      {/* Right: schedule preview card */}
      <div className="relative mx-auto w-full max-w-md">
        <div className="absolute -inset-4 rounded-3xl bg-emerald-100/60 blur-2xl" />
        <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <CalendarDays className="h-4 w-4 text-emerald-600" /> Next pickup
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-900">Thursday, Oct 22</p>
          <p className="text-sm font-medium text-slate-500">
            {barangay ? `Barangay ${barangay}` : "Your barangay"} · 6:00 AM
          </p>

          <ul className="mt-6 space-y-3">
            <PreviewRow
              icon={<Leaf className="h-4 w-4" />}
              label="Biodegradable"
              day="Mon"
              color="bg-emerald-50 text-emerald-700 border-emerald-100"
            />
            <PreviewRow
              icon={<Trash2 className="h-4 w-4" />}
              label="General Waste"
              day="Thu"
              color="bg-slate-100 text-slate-700 border-slate-200"
            />
            <PreviewRow
              icon={<Recycle className="h-4 w-4" />}
              label="Recyclable"
              day="Sat"
              color="bg-blue-50 text-blue-700 border-blue-100"
            />
          </ul>

          <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2 border border-emerald-100">
            <span>🔔</span> Reminder sent the evening before collection
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewRow({
  icon,
  label,
  day,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  day: string;
  color: string;
}) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 bg-white">
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${color}`}>
        {icon} {label}
      </span>
      <span className="text-sm font-semibold text-slate-600">{day}</span>
    </li>
  );
}
