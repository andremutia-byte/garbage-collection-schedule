"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { SafeUserButton } from "@/components/SafeUserButton";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Leaf,
  Loader2,
  MapPin,
  Recycle,
  Sparkles,
  Trash2,
} from "lucide-react";
import type { BarangayItem, ScheduleItem } from "@/app/actions/barangays";
import { getSchedulesByBarangay } from "@/app/actions/barangays";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const FREQ_LABELS: Record<string, string> = {
  weekly: "Weekly Collection",
  biweekly: "Every 2 Weeks",
  monthly: "Monthly Collection",
  custom: "Custom Schedule",
};

function getNextPickupDate(dayOfWeek: number | null) {
  if (dayOfWeek === null) return "Ongoing schedule";
  const now = new Date();
  const currentDay = now.getDay();
  let diff = dayOfWeek - currentDay;
  if (diff < 0) {
    diff += 7;
  } else if (diff === 0 && now.getHours() >= 9) {
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

function getCategoryIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("green") || lower.includes("bio") || lower.includes("garden")) {
    return <Leaf className="h-4 w-4 text-emerald-600" />;
  }
  if (lower.includes("recycle") || lower.includes("plastic") || lower.includes("paper")) {
    return <Recycle className="h-4 w-4 text-blue-600" />;
  }
  return <Trash2 className="h-4 w-4 text-slate-600" />;
}

export function ScheduleClient({
  initialBarangays,
  initialSelectedBarangay,
  initialScheduleData,
}: {
  initialBarangays: BarangayItem[];
  initialSelectedBarangay: string;
  initialScheduleData: { barangay: BarangayItem | null; schedules: ScheduleItem[] };
}) {
  const router = useRouter();

  const [selectedBarangay, setSelectedBarangay] = useState(initialSelectedBarangay);
  const [schedules, setSchedules] = useState<ScheduleItem[]>(
    initialScheduleData.schedules
  );
  const [isPending, startTransition] = useTransition();

  const handleBarangayChange = (newBarangay: string) => {
    setSelectedBarangay(newBarangay);
    startTransition(async () => {
      if (newBarangay) {
        router.push(`/schedule?barangay=${encodeURIComponent(newBarangay)}`);
        const data = await getSchedulesByBarangay(newBarangay);
        setSchedules(data.schedules);
      } else {
        router.push("/schedule");
        const data = await getSchedulesByBarangay("");
        setSchedules(data.schedules);
      }
    });
  };

  // Compute the closest next scheduled pickup among the real schedules
  const nextPickup = schedules.reduce<{
    schedule: ScheduleItem;
    formattedDate: string;
    daysAway: number;
  } | null>((closest, item) => {
    if (item.day_of_week === null) return closest;
    const now = new Date();
    const currentDay = now.getDay();
    let diff = item.day_of_week - currentDay;
    if (diff < 0) diff += 7;
    else if (diff === 0 && now.getHours() >= 9) diff = 7;

    if (!closest || diff < closest.daysAway) {
      return {
        schedule: item,
        formattedDate: getNextPickupDate(item.day_of_week),
        daysAway: diff,
      };
    }
    return closest;
  }, null);

  // Top featured barangays for quick selection pills
  const featuredBarangays = [
    "Ampayon",
    "Baan Km 3",
    "Bancasi",
    "Libertad",
    "Pigdaulan",
    "Doongan",
    "Villa Kananga",
    "San Vicente",
  ].filter((name) => initialBarangays.some((b) => b.name === name));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Recycle className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors leading-none">
                ButuanLinis
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block leading-none mt-1">
                A Cleaner Butuan, One Collection at a Time
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Home
            </Link>

            <Show
              when="signed-out"
              fallback={
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 px-3.5 py-1.5 transition-colors shadow-xs"
                  >
                    My Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                  <SafeUserButton />
                </div>
              }
            >
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all hover:shadow-sm cursor-pointer">
                    Get Reminders
                  </button>
                </SignUpButton>
              </div>
            </Show>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Top Barangay Selection Bar */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Butuan City Waste Management
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {selectedBarangay
                  ? `Barangay ${selectedBarangay}`
                  : "Check Your Barangay Schedule"}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Live collection schedule and waste segregation guidelines for Butuan City residents.
              </p>
            </div>

            {/* Select Dropdown */}
            <div className="w-full md:w-80">
              <label
                htmlFor="barangay-select"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2"
              >
                Select Barangay ({initialBarangays.length} available)
              </label>
              <div className="relative">
                <select
                  id="barangay-select"
                  value={selectedBarangay}
                  onChange={(e) => handleBarangayChange(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-xs cursor-pointer"
                >
                  <option value="">Choose your barangay…</option>
                  {initialBarangays.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                  ) : (
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick select pills */}
          <div className="mt-6 flex flex-wrap items-center gap-2 pt-6 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 mr-1">Popular:</span>
            {featuredBarangays.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleBarangayChange(name)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  selectedBarangay === name
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Project Demonstration Notice */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-900 shadow-2xs">
          <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-bold">Academic Project Demonstration Schedules: </span>
            <span>
              All 86 barangays of Butuan City have independently configured demonstration schedules with collection days, pickup times, and waste categories for academic demonstration purposes (Asia/Manila timezone). These are demonstration schedules and not official municipal timetables.
            </span>
          </div>
        </div>

        {selectedBarangay ? (
          <div className="mt-8 space-y-8">
            {/* Highlight: Next Pickup Card */}
            {nextPickup && (
              <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white shadow-lg sm:p-8">
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-xs">
                      <Sparkles className="h-3.5 w-3.5" /> Next Scheduled Pickup
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                      {nextPickup.formattedDate}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 text-emerald-50 text-sm font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" /> {nextPickup.schedule.collection_time || "6:00 AM – 9:00 AM"}
                      </span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {nextPickup.schedule.barangay_name === "All Barangays"
                          ? `City-wide Service · Barangay ${selectedBarangay}`
                          : nextPickup.schedule.barangay_name}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-md border border-white/20 md:max-w-xs">
                    <div className="text-xs uppercase tracking-wider text-emerald-100 font-semibold">
                      Collecting
                    </div>
                    <div className="mt-1 text-xl font-bold text-white">
                      {nextPickup.schedule.category.name}
                    </div>
                    {nextPickup.schedule.category.instructions && (
                      <p className="mt-2 text-xs text-emerald-100 leading-relaxed">
                        {nextPickup.schedule.category.instructions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Weekly Schedule Grid */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Active Collection Rules ({schedules.length})
                  </h2>
                  <p className="text-sm text-slate-500">
                    Official schedule for Barangay {selectedBarangay}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Live Database Schedule
                </span>
              </div>

              {schedules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                  <Calendar className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="mt-2 text-base font-bold text-slate-800">
                    No collection schedule available yet.
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    The garbage collection schedule for Barangay {selectedBarangay} has not been posted yet by the city administration.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {schedules.map((item) => {
                    const icon = getCategoryIcon(item.category.name);
                    const dayLabel =
                      item.day_of_week !== null
                        ? DAYS[item.day_of_week]
                        : "Any day";
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-slate-300"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-slate-900">
                              {dayLabel}
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border"
                              style={{
                                backgroundColor: item.category.color_code
                                  ? `${item.category.color_code}18`
                                  : "#f1f5f9",
                                borderColor: item.category.color_code
                                  ? `${item.category.color_code}44`
                                  : "#e2e8f0",
                                color: item.category.color_code || "#334155",
                              }}
                            >
                              {icon}
                              {item.category.name}
                            </span>
                          </div>

                          <div className="mt-4">
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              {FREQ_LABELS[item.frequency] || item.frequency}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              {item.collection_time || "Morning Pickup (6:00 AM – 9:00 AM)"}
                            </div>
                            <p className="mt-3 text-xs leading-relaxed text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {item.category.instructions ||
                                "Please place segregated bins curbside before 6:00 AM."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {item.barangay_name === "All Barangays"
                              ? "City-wide rule"
                              : `Specific to ${item.barangay_name}`}
                          </span>
                          <span className="font-semibold text-slate-700">
                            {getNextPickupDate(item.day_of_week)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800">
                    Collection Advisory:{" "}
                  </span>
                  Collection trucks operate every morning starting at 6:00 AM.
                  Residents are advised to place closed bins or tied bags at designated pickup points along roads and purok corners.
                </div>
              </div>
            </section>

            {/* Waste Segregation Guide */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-1">
                Waste Segregation Guide
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                City Ordinance strictly enforces &quot;No Segregation, No Collection&quot;. Please sort accordingly.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5">
                  <div className="flex items-center gap-2 font-semibold text-emerald-800 text-sm mb-2">
                    <Leaf className="h-4 w-4 text-emerald-600" /> Biodegradable / Organic
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>Leftover food & vegetable scraps</li>
                    <li>Fruit peelings & seed cores</li>
                    <li>Garden leaves, weeds & grass</li>
                    <li>Eggshells & coffee grounds</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                  <div className="flex items-center gap-2 font-semibold text-blue-800 text-sm mb-2">
                    <Recycle className="h-4 w-4 text-blue-600" /> Recyclable Materials
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>Rinsed plastic bottles & jugs</li>
                    <li>Cardboard & corrugated boxes</li>
                    <li>Clean paper, newspapers, magazines</li>
                    <li>Aluminum cans & scrap metal</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm mb-2">
                    <Trash2 className="h-4 w-4 text-slate-600" /> Residual / General Waste
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>Candy & snack wrappers</li>
                    <li>Sanitary napkins & diapers (bagged)</li>
                    <li>Broken glass & ceramic (wrapped)</li>
                    <li>Worn out fabrics & non-recyclables</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Reminder Callout Banner */}
            <div id="alert-options" className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6 scroll-mt-24">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <BellRing className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Get Reminded Before Pickup Day in Barangay {selectedBarangay}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 max-w-xl">
                    Register your household address once with ButuanLinis and receive SMS or Email alerts the evening before every collection.
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <Show
                  when="signed-in"
                  fallback={
                    <SignUpButton mode="modal">
                      <button className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-xs hover:bg-emerald-700 transition hover:scale-[1.02] cursor-pointer">
                        Sign up for reminders <ArrowRight className="h-4 w-4" />
                      </button>
                    </SignUpButton>
                  }
                >
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-xs hover:bg-emerald-700 transition hover:scale-[1.02]"
                  >
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Link>
                </Show>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State when no barangay is selected */
          <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Select Your Barangay to View Collection Days
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Pick your barangay from the list of {initialBarangays.length} Butuan City barangays above or choose one of the popular barangays below.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {featuredBarangays.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleBarangayChange(name)}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:border-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} ButuanLinis &bull; City Government of Butuan Waste Management Office.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-slate-800 transition">Home</Link>
            <Link href="/sign-in" className="hover:text-slate-800 transition">Sign In</Link>
            <Link href="/dashboard" className="hover:text-slate-800 transition">Resident Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
