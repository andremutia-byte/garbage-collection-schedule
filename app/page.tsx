import { Show } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { SafeUserButton } from "@/components/SafeUserButton";
import Link from "next/link";
import Hero from "@/components/Hero";
import { getBarangays, getSchedulesByBarangay } from "@/app/actions/barangays";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Info,
  Leaf,
  MapPin,
  Recycle,
  Sparkles,
  Trash2,
} from "lucide-react";

export default async function LandingPage() {
  const barangays = await getBarangays();
  const initialBarangay = "Ampayon";
  const initialScheduleData = await getSchedulesByBarangay(initialBarangay);
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 sm:h-20 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Left: ButuanLinis Logo + Subtitle */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            aria-label="ButuanLinis Home"
          >
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700 transition-colors shrink-0">
              <Recycle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors leading-tight">
                ButuanLinis
              </span>
              <span className="text-xs sm:text-sm text-slate-500 font-medium leading-tight">
                Garbage Collection Schedule
              </span>
            </div>
          </Link>

          {/* Right: Clean, welcoming actions for all residents */}
          <nav className="flex items-center gap-2 sm:gap-3">
            <Show
              when="signed-out"
              fallback={
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm sm:text-base px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-xs hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 shrink-0 cursor-pointer"
                  >
                    <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span>Check My Schedule</span>
                  </Link>
                  <SafeUserButton />
                </div>
              }
            >
              <div className="flex items-center gap-1.5 sm:gap-3">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="text-sm sm:text-base font-semibold text-slate-700 hover:text-emerald-800 px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                  >
                    Log In
                  </button>
                </SignInButton>
                <Link
                  href="/schedule"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm sm:text-base px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-xs hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 shrink-0 cursor-pointer"
                >
                  <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                  <span>Check My Schedule</span>
                </Link>
              </div>
            </Show>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:24px_24px]" />
          <Hero
            initialBarangays={barangays}
            initialBarangay={initialBarangay}
            initialSchedules={initialScheduleData.schedules}
          />
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="bg-slate-50 py-16 sm:py-24 scroll-mt-16 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                Simple 3-Step Process
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                How It Works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
                Stay on top of garbage collection in your neighborhood in three easy steps.
              </p>
            </div>

            <div className="mt-12 sm:mt-16 mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Step 1: Select Your Barangay */}
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-sm transition-all group">
                  <div className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-xs">
                    1
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 border border-emerald-100 group-hover:scale-105 transition-transform">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Select Your Barangay
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Choose from all 86 barangays of Butuan City to view localized collection routes and schedules for your neighborhood.
                  </p>
                </div>

                {/* Step 2: Check Your Collection Schedule */}
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-sm transition-all group">
                  <div className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-xs">
                    2
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 border border-blue-100 group-hover:scale-105 transition-transform">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Check Your Collection Schedule
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    See designated pickup days, morning collection times, and specific waste categories scheduled for your address.
                  </p>
                </div>

                {/* Step 3: Prepare Your Waste */}
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col items-center text-center hover:border-emerald-300 hover:shadow-sm transition-all group">
                  <div className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-extrabold shadow-xs">
                    3
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-100 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Prepare Your Waste
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Sort your garbage into general waste, recyclables, or garden waste, and place your bins or tied bags out before pickup time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Waste Segregation Guide (Know Your Waste) */}
        <section id="waste-segregation-guide" className="bg-white py-16 sm:py-24 scroll-mt-16 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Waste Segregation Guide
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                Know Your Waste
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
                Proper waste segregation protects our community and helps local collectors work safely. Sort your household waste into these three primary categories before collection day:
              </p>
            </div>

            {/* 3 Waste Cards: Horizontal on Desktop, Vertical on Mobile */}
            <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* 1. General Waste */}
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-7 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-200/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <Trash2 className="h-3.5 w-3.5" />
                      General Waste
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shadow-2xs">
                      <Trash2 className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    General Waste
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    Used tissues, dirty wrappers, and non-recyclable household waste.
                  </p>

                  <div className="rounded-xl bg-white p-4 border border-slate-200/80 shadow-2xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                      Accepted Examples:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span>Used tissues, paper towels & soiled napkins</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span>Dirty food wrappers & single-use snack sachets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span>Worn-out cleaning sponges & rags</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                        <span>Broken domestic plastics & residual household trash</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Place securely in tied trash bags before morning pickup.</span>
                </div>
              </div>

              {/* 2. Recyclables */}
              <div className="flex flex-col justify-between rounded-2xl border border-blue-200 bg-blue-50/60 p-6 sm:p-7 shadow-xs hover:shadow-sm hover:border-blue-300 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
                      <Recycle className="h-3.5 w-3.5" />
                      Recyclables
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
                      <Recycle className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Recyclables
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    Clean plastic bottles, paper, cardboard, and metal cans.
                  </p>

                  <div className="rounded-xl bg-white p-4 border border-blue-100 shadow-2xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2.5">
                      Accepted Examples:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Clean plastic drinking & detergent bottles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Dry newspapers, office paper, books & flyers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Flattened cardboard cartons & clean boxes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <span>Clean tin, steel, and aluminum beverage cans</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-blue-200 text-xs text-blue-700 font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-blue-500 shrink-0" />
                  <span>Rinse containers and ensure materials are clean and dry.</span>
                </div>
              </div>

              {/* 3. Green Garden Waste */}
              <div className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-7 shadow-xs hover:shadow-sm hover:border-emerald-300 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                      <Leaf className="h-3.5 w-3.5" />
                      Green Garden Waste
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                      <Leaf className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Green Garden Waste
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    Leaves, grass clippings, and small branches.
                  </p>

                  <div className="rounded-xl bg-white p-4 border border-emerald-100 shadow-2xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2.5">
                      Accepted Examples:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Dry and fallen tree leaves</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Lawn grass clippings & shrub prunings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Small pruned twigs & branches</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>Fallen blossoms, weeds & garden yard trimmings</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Bundle small branches neatly or place leaves in sacks.</span>
                </div>
              </div>
            </div>

            {/* Reminder & Disclaimer Box */}
            <div className="mt-10 sm:mt-12 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0 shadow-xs">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-slate-900">
                    Friendly Reminder: Segregate Waste Before Collection Day
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Please sort your household garbage at home and place bins or tied sacks outside before the morning pickup time. Proper waste segregation speeds up collection routes and keeps our city clean and green!
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-2 italic">
                    * Notice: These examples are general educational reminders for Butuan City residents. Official acceptance rules, pickup schedules, and collection requirements may vary by barangay.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Explanation */}
        <section id="categories" className="bg-slate-50 py-16 sm:py-24 overflow-hidden scroll-mt-16 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800 mb-3">
                  Community Impact
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  Keeping Butuan clean, together.
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                  We bridge the gap between municipal waste management and residents across Butuan City. By providing a clear, accessible scheduling platform, ButuanLinis helps reduce missed pickups, improve recycling rates, and maintain cleaner streets for everyone.
                </p>
                <ul className="mt-8 space-y-4 text-slate-700">
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Clear distinction between waste categories</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Up-to-date collection schedules for all 86 barangays</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Reliable notifications and schedule tracking</span>
                  </li>
                </ul>
              </div>

              <div className="relative">
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      City of Butuan Cleanliness Mission
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                      86 Barangays
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">General Waste</p>
                        <p className="text-xs text-slate-500">Used tissues, dirty wrappers, non-recyclable household trash</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shrink-0">
                        <Recycle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Recyclables</p>
                        <p className="text-xs text-slate-500">Clean plastic bottles, paper, cardboard, and metal cans</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Green Garden Waste</p>
                        <p className="text-xs text-slate-500">Leaves, grass clippings, and small pruned branches</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-emerald-900 py-16 sm:py-20 text-white relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
              Ready to keep Butuan clean and green?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              Register once and always know when to put your bins out.
            </p>
            <div className="mt-8 flex justify-center">
              <Show
                when="signed-in"
                fallback={
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-white px-8 py-3.5 text-sm sm:text-base font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                      Register Your Address
                    </button>
                  </SignUpButton>
                }
              >
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-8 py-3.5 text-sm sm:text-base font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98] inline-block"
                >
                  Go to My Schedule
                </Link>
              </Show>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <Recycle className="h-4.5 w-4.5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">
                ButuanLinis
              </span>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-xs sm:text-sm text-slate-500 italic">
              “A Cleaner Butuan, One Collection at a Time.”
            </span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} ButuanLinis. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#waste-segregation-guide" className="hover:text-slate-900 transition-colors">
              Waste Segregation Guide
            </a>
            <a href="/dashboard" className="hover:text-slate-900 transition-colors">
              Resident Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
