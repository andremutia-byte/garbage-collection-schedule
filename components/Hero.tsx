"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  CalendarDays,
  Clock,
  Leaf,
  Loader2,
  MapPin,
  Recycle,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  getBarangays,
  getSchedulesByBarangay,
  type BarangayItem,
  type ScheduleItem,
} from "@/app/actions/barangays";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type BarangayOption = BarangayItem;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Calculates the next upcoming pickup date from a day_of_week integer (0 = Sun, 1 = Mon ... 6 = Sat)
 */
function getNextPickupDate(dayOfWeek: number | null) {
  if (dayOfWeek === null || dayOfWeek === undefined) return "Upcoming";
  const now = new Date();
  const currentDay = now.getDay();
  let diff = dayOfWeek - currentDay;
  if (diff < 0) {
    diff += 7;
  } else if (diff === 0 && now.getHours() >= 12) {
    diff = 7;
  }
  const nextDate = new Date();
  nextDate.setDate(now.getDate() + diff);
  return nextDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

/**
 * Waste category styling and icon helper
 */
function getCategoryStyle(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("green") || lower.includes("bio") || lower.includes("garden")) {
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Leaf className="h-4 w-4 text-emerald-600 shrink-0" />,
    };
  }
  if (lower.includes("recycle") || lower.includes("plastic") || lower.includes("paper")) {
    return {
      bg: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Recycle className="h-4 w-4 text-blue-600 shrink-0" />,
    };
  }
  return {
    bg: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <Trash2 className="h-4 w-4 text-slate-600 shrink-0" />,
  };
}

export default function Hero({
  initialBarangays = [],
  initialBarangay = "",
  initialSchedules = [],
}: {
  initialBarangays?: BarangayOption[];
  initialBarangay?: string;
  initialSchedules?: ScheduleItem[];
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Selected barangay state
  const [barangay, setBarangay] = useState(initialBarangay);
  const [barangayList, setBarangayList] = useState<BarangayOption[]>(initialBarangays);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(initialBarangays.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, startTransition] = useTransition();

  // Destination for viewing schedules & alert/notification preferences
  const targetAlertsUrl = isSignedIn
    ? "/dashboard"
    : `/sign-in?redirect_url=${encodeURIComponent("/dashboard")}`;

  const handleAlertOptionsClick = (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    router.push(targetAlertsUrl);
  };

  // Schedule data state
  const [currentSchedules, setCurrentSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [isFetchingSchedules, setIsFetchingSchedules] = useState(false);
  const [schedulesCache, setSchedulesCache] = useState<Record<string, ScheduleItem[]>>(() => {
    if (initialBarangay && initialSchedules.length > 0) {
      return { [initialBarangay]: initialSchedules };
    }
    return {};
  });

  // Load barangay list if not provided by server
  const handleRetry = async () => {
    setIsLoadingBarangays(true);
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
      setIsLoadingBarangays(false);
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
            setIsLoadingBarangays(false);
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
                setIsLoadingBarangays(false);
              })
              .catch((err: unknown) => {
                if (ignore) return;
                console.error("Fallback client fetch failed:", err);
                setError("Unable to load barangay list. Please check your connection and retry.");
                setIsLoadingBarangays(false);
              });
          }
        })
        .catch((err: unknown) => {
          if (ignore) return;
          console.error("Failed to load barangays in Hero:", err);
          setError("Unable to load barangay list. Please check your connection and retry.");
          setIsLoadingBarangays(false);
        });
    }
    return () => {
      ignore = true;
    };
  }, [initialBarangays]);

  // Handle barangay selection and dynamic schedule update
  const handleSelectBarangay = async (selectedName: string) => {
    setBarangay(selectedName);
    if (!selectedName) {
      setCurrentSchedules([]);
      return;
    }

    // Check client cache first for instant feedback
    if (schedulesCache[selectedName]) {
      setCurrentSchedules(schedulesCache[selectedName]);
      return;
    }

    // Fetch schedules for the newly selected barangay
    setIsFetchingSchedules(true);
    try {
      const data = await getSchedulesByBarangay(selectedName);
      const scheds = data?.schedules ?? [];
      setCurrentSchedules(scheds);
      setSchedulesCache((prev) => ({ ...prev, [selectedName]: scheds }));
    } catch (fetchErr) {
      console.error("Failed to fetch schedules for selected barangay:", fetchErr);
    } finally {
      setIsFetchingSchedules(false);
    }
  };

  // Submit action: Navigate to full schedule page
  function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    if (!barangay || isNavigating) return;
    startTransition(() => {
      router.push(`/schedule?barangay=${encodeURIComponent(barangay)}`);
    });
  }

  // Calculate the closest next scheduled pickup among the active schedules
  const nextPickup = currentSchedules.reduce<{
    schedule: ScheduleItem;
    formattedDate: string;
    daysAway: number;
  } | null>((closest, item) => {
    if (item.day_of_week === null || item.day_of_week === undefined) return closest;
    const now = new Date();
    const currentDay = now.getDay();
    let diff = item.day_of_week - currentDay;
    if (diff < 0) diff += 7;
    else if (diff === 0 && now.getHours() >= 12) diff = 7;

    if (!closest || diff < closest.daysAway) {
      return {
        schedule: item,
        formattedDate: getNextPickupDate(item.day_of_week),
        daysAway: diff,
      };
    }
    return closest;
  }, null);

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
              onChange={(e) => handleSelectBarangay(e.target.value)}
              disabled={isLoadingBarangays}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer pr-10"
            >
              {isLoadingBarangays ? (
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
              {isLoadingBarangays ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
              ) : (
                <ArrowRight className="h-4 w-4 rotate-90 text-slate-400" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!barangay || isLoadingBarangays || isNavigating}
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

        {/* View Schedules & Alert Options Action Button */}
        <div className="mt-5 flex items-center max-w-xl">
          <Link
            id="view-schedules-alert-options"
            href={targetAlertsUrl}
            onClick={handleAlertOptionsClick}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs hover:border-emerald-300 hover:bg-emerald-50/70 hover:text-emerald-800 active:bg-emerald-100 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer pointer-events-auto relative z-10"
            aria-label="View collection schedules and manage notification alert options"
          >
            <BellRing className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>View Schedules & Alert Options</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
          </Link>
        </div>
      </div>

      {/* Right: Dynamic schedule preview card for the selected barangay */}
      <div className="relative mx-auto w-full max-w-md">
        <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-emerald-100/60 blur-2xl" />
        <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all">
          {/* Card Top Label */}
          <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            <span className="inline-flex items-center gap-1.5 text-emerald-700">
              <CalendarDays className="h-4 w-4 text-emerald-600" />
              {barangay ? `Barangay ${barangay}` : "Schedule Preview"}
            </span>
            {isFetchingSchedules ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating…
              </span>
            ) : currentSchedules.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Sparkles className="h-3 w-3" /> Active
              </span>
            ) : null}
          </div>

          {/* Conditional Rendering: Schedules Found vs No Schedule vs No Barangay Selected */}
          {!barangay ? (
            /* State: No barangay selected yet */
            <div className="flex flex-col items-center justify-center text-center py-8 px-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 mb-3">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Select Your Barangay</h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-xs leading-relaxed">
                Choose any of the 86 official barangays of Butuan City to see pickup dates, collection times, and waste categories.
              </p>
            </div>
          ) : currentSchedules.length === 0 ? (
            /* State: Barangay selected, but has no schedules configured yet */
            <div className="flex flex-col items-center justify-center text-center py-6 px-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 mb-3">
                <AlertCircle className="h-6 w-6" />
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-0.5 text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
                No Schedule Posted
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                No collection schedule available yet.
              </h3>
              <p className="mt-1.5 text-xs text-slate-500 max-w-xs leading-relaxed">
                The garbage collection schedule for <strong>Barangay {barangay}</strong> has not been posted yet by the city administration.
              </p>
              <div className="mt-5 w-full pt-4 border-t border-slate-100 flex items-center justify-center">
                <Link
                  href="/schedule"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                >
                  Browse city-wide guidelines <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ) : (
            /* State: Active schedules found for the selected barangay */
            <>
              {/* Prominent Next Pickup Date */}
              <div className="mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Next Pickup
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {nextPickup ? nextPickup.formattedDate : "Upcoming Collection"}
                </p>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mt-1">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    {nextPickup ? nextPickup.schedule.collection_time : "06:00 AM – 09:00 AM"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>Barangay {barangay}</span>
                </div>
              </div>

              {/* List of configured waste category rules for this barangay */}
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Configured Waste Categories & Days
                </p>
                <ul className="space-y-2">
                  {currentSchedules.map((s) => {
                    const style = getCategoryStyle(s.category.name);
                    const dayLabel =
                      s.day_of_week !== null && s.day_of_week !== undefined
                        ? SHORT_DAYS[s.day_of_week]
                        : "Any day";
                    return (
                      <li
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 px-3.5 py-2.5 bg-slate-50/70"
                      >
                        <span
                          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-semibold ${style.bg}`}
                        >
                          {style.icon}
                          {s.category.name}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-800">
                            {dayLabel}
                          </span>
                          <span className="block text-[11px] text-slate-500 font-medium">
                            {s.collection_time}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Evening reminder note */}
              <div className="mt-5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2 border border-emerald-100">
                <span>🔔</span>
                <span className="leading-tight">
                  Reminder sent the evening before collection
                </span>
              </div>

              {/* Link to full schedule */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <Link
                  href={`/schedule?barangay=${encodeURIComponent(barangay)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  View full calendar & details for {barangay} <ArrowRight className="h-3 w-3" />
                </Link>
                <p className="mt-2 text-[10px] text-slate-400 text-center italic">
                  Demonstration schedule for academic project testing · Asia/Manila Timezone
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
