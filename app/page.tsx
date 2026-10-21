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
    <div className="flex min-h-screen flex-col bg-[#FAF9F5] text-[#172B3A] font-sans selection:bg-[#E8F0E7] selection:text-[#176B45]">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-[#FAF9F5]/95 backdrop-blur-md">
        <div className="mx-auto flex h-18 sm:h-20 max-w-7xl items-center justify-between px-3.5 sm:px-6 lg:px-8">
          {/* Left: ButuanLinis Logo + Subtitle */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B45] rounded-xl"
            aria-label="ButuanLinis Home"
          >
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#176B45] text-white shadow-xs group-hover:bg-[#125536] transition-colors shrink-0">
              <Recycle className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-[#172B3A] group-hover:text-[#176B45] transition-colors leading-tight">
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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#176B45] hover:bg-[#125536] active:bg-[#0f442b] text-white font-semibold text-sm sm:text-base px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-xs hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B45] focus-visible:ring-offset-2 shrink-0 cursor-pointer"
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
                    className="text-sm sm:text-base font-semibold text-[#172B3A] hover:text-[#176B45] px-2.5 py-2 sm:px-3.5 sm:py-2 rounded-lg hover:bg-[#E8F0E7]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B45] cursor-pointer"
                  >
                    Log In
                  </button>
                </SignInButton>
                <Link
                  href="/schedule"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#176B45] hover:bg-[#125536] active:bg-[#0f442b] text-white font-semibold text-sm sm:text-base px-3.5 py-2 sm:px-5 sm:py-2.5 shadow-xs hover:shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#176B45] focus-visible:ring-offset-2 shrink-0 cursor-pointer"
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
        {/* Hero Section with Butuan Bridge (TULAY.jpg) Background */}
        <div
          className="relative overflow-hidden bg-cover bg-no-repeat bg-[position:65%_center] md:bg-[position:center_32%]"
          style={{
            backgroundImage: "url('/images/TULAY.jpg')",
            backgroundSize: "cover",
          }}
        >
          {/* Subtle multi-layer overlay to ensure heading and text remain readable while keeping the bridge visible */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF9F5]/92 via-[#FAF9F5]/82 to-[#FAF9F5]/75 md:bg-gradient-to-r md:from-[#FAF9F5]/95 md:via-[#FAF9F5]/80 md:to-[#FAF9F5]/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F5] via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            <Hero
              initialBarangays={barangays}
              initialBarangay={initialBarangay}
              initialSchedules={initialScheduleData.schedules}
            />
          </div>
        </div>

        {/* How It Works */}
        <section id="how-it-works" className="bg-[#FAF9F5] py-16 sm:py-24 scroll-mt-16 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E7] border border-[#176B45]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#176B45] mb-3">
                Simple 3-Step Process
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#172B3A]">
                How It Works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
                Stay on top of garbage collection in your neighborhood in three easy steps.
              </p>
            </div>

            <div className="mt-12 sm:mt-16 mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Step 1: Select Your Barangay */}
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col items-center text-center hover:border-[#176B45]/40 hover:shadow-sm transition-all group">
                  <div className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#176B45] text-white text-xs font-extrabold shadow-xs">
                    1
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E7] text-[#176B45] mb-5 border border-[#176B45]/20 group-hover:scale-105 transition-transform">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#172B3A] mb-2">
                    Select Your Barangay
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Choose from all 86 barangays of Butuan City to view localized collection routes and schedules for your neighborhood.
                  </p>
                </div>

                {/* Step 2: Check Your Collection Schedule */}
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col items-center text-center hover:border-[#376B87]/40 hover:shadow-sm transition-all group">
                  <div className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#176B45] text-white text-xs font-extrabold shadow-xs">
                    2
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#376B87]/15 text-[#376B87] mb-5 border border-[#376B87]/25 group-hover:scale-105 transition-transform">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#172B3A] mb-2">
                    Check Your Collection Schedule
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    See designated pickup days, morning collection times, and specific waste categories scheduled for your address.
                  </p>
                </div>

                {/* Step 3: Prepare Your Waste */}
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/90 flex flex-col items-center text-center hover:border-[#176B45]/40 hover:shadow-sm transition-all group">
                  <div className="absolute -top-3.5 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#176B45] text-white text-xs font-extrabold shadow-xs">
                    3
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F0E7] text-[#176B45] mb-5 border border-[#176B45]/20 group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-[#172B3A] mb-2">
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E7] border border-[#176B45]/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#176B45] mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[#176B45]" />
                Waste Segregation Guide
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#172B3A]">
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
                  <h3 className="text-xl font-bold text-[#172B3A] mb-2">
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
              <div className="flex flex-col justify-between rounded-2xl border border-[#376B87]/30 bg-blue-50/60 p-6 sm:p-7 shadow-xs hover:shadow-sm hover:border-[#376B87]/60 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#376B87]/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#376B87]">
                      <Recycle className="h-3.5 w-3.5" />
                      Recyclables
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#376B87] text-white shadow-2xs">
                      <Recycle className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#172B3A] mb-2">
                    Recyclables
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    Clean plastic bottles, paper, cardboard, and metal cans.
                  </p>

                  <div className="rounded-xl bg-white p-4 border border-blue-100 shadow-2xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#376B87] mb-2.5">
                      Accepted Examples:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#376B87] mt-1.5 shrink-0" />
                        <span>Clean plastic drinking & detergent bottles</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#376B87] mt-1.5 shrink-0" />
                        <span>Dry newspapers, office paper, books & flyers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#376B87] mt-1.5 shrink-0" />
                        <span>Flattened cardboard cartons & clean boxes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#376B87] mt-1.5 shrink-0" />
                        <span>Clean tin, steel, and aluminum beverage cans</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#376B87]/20 text-xs text-[#376B87] font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#376B87] shrink-0" />
                  <span>Rinse containers and ensure materials are clean and dry.</span>
                </div>
              </div>

              {/* 3. Green Garden Waste */}
              <div className="flex flex-col justify-between rounded-2xl border border-[#176B45]/30 bg-[#E8F0E7]/60 p-6 sm:p-7 shadow-xs hover:shadow-sm hover:border-[#176B45]/60 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E7] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#176B45] border border-[#176B45]/20">
                      <Leaf className="h-3.5 w-3.5" />
                      Green Garden Waste
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#176B45] text-white shadow-2xs">
                      <Leaf className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#172B3A] mb-2">
                    Green Garden Waste
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">
                    Leaves, grass clippings, and small branches.
                  </p>

                  <div className="rounded-xl bg-white p-4 border border-[#176B45]/20 shadow-2xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#176B45] mb-2.5">
                      Accepted Examples:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                        <span>Dry and fallen tree leaves</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                        <span>Lawn grass clippings & shrub prunings</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                        <span>Small pruned twigs & branches</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#176B45] mt-1.5 shrink-0" />
                        <span>Fallen blossoms, weeds & garden yard trimmings</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#176B45]/20 text-xs text-[#176B45] font-medium flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#176B45] shrink-0" />
                  <span>Bundle small branches neatly or place leaves in sacks.</span>
                </div>
              </div>
            </div>

            {/* Reminder & Disclaimer Box */}
            <div className="mt-10 sm:mt-12 rounded-2xl bg-gradient-to-r from-[#E8F0E7] via-[#FAF9F5] to-[#E8F0E7] border border-[#176B45]/25 p-5 sm:p-7 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#176B45] text-white shrink-0 shadow-xs">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-bold text-[#172B3A]">
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
        <section id="categories" className="bg-[#FAF9F5] py-16 sm:py-24 overflow-hidden scroll-mt-16 border-t border-slate-200/80">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0E7] border border-[#176B45]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#176B45] mb-3">
                  Community Impact
                </span>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#172B3A]">
                  Keeping Butuan clean, together.
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                  We bridge the gap between municipal waste management and residents across Butuan City. By providing a clear, accessible scheduling platform, ButuanLinis helps reduce missed pickups, improve recycling rates, and maintain cleaner streets for everyone.
                </p>
                <ul className="mt-8 space-y-4 text-slate-700">
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F0E7] text-[#176B45] border border-[#176B45]/20 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Clear distinction between waste categories</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F0E7] text-[#176B45] border border-[#176B45]/20 shrink-0">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Up-to-date collection schedules for all 86 barangays</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F0E7] text-[#176B45] border border-[#176B45]/20 shrink-0">
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0E7] border border-[#176B45]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#176B45]">
                      86 Barangays
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#172B3A] text-sm">General Waste</p>
                        <p className="text-xs text-slate-500">Used tissues, dirty wrappers, non-recyclable household trash</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#376B87]/10 border border-[#376B87]/20">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#376B87] text-white shrink-0">
                        <Recycle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#172B3A] text-sm">Recyclables</p>
                        <p className="text-xs text-slate-500">Clean plastic bottles, paper, cardboard, and metal cans</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#E8F0E7]/70 border border-[#176B45]/20">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#176B45] text-white shrink-0">
                        <Leaf className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#172B3A] text-sm">Green Garden Waste</p>
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
        <section className="bg-[#176B45] py-16 sm:py-20 text-white relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#FAF9F5]">
              Ready to keep Butuan clean and green?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-[#FAF9F5]/90 leading-relaxed">
              Register once and always know when to put your bins out.
            </p>
            <div className="mt-8 flex justify-center">
              <Show
                when="signed-in"
                fallback={
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-[#FAF9F5] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#176B45] shadow-sm hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                      Register Your Address
                    </button>
                  </SignUpButton>
                }
              >
                <Link
                  href="/dashboard"
                  className="rounded-full bg-[#FAF9F5] px-8 py-3.5 text-sm sm:text-base font-semibold text-[#176B45] shadow-sm hover:bg-white transition-all hover:scale-[1.02] active:scale-[0.98] inline-block"
                >
                  Go to My Schedule
                </Link>
              </Show>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#FAF9F5] border-t border-slate-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#176B45] text-white shadow-2xs">
                <Recycle className="h-4.5 w-4.5" />
              </div>
              <span className="font-bold text-[#172B3A] text-lg">
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
            <a href="#how-it-works" className="hover:text-[#176B45] transition-colors">
              How It Works
            </a>
            <a href="#waste-segregation-guide" className="hover:text-[#176B45] transition-colors">
              Waste Segregation Guide
            </a>
            <a href="/dashboard" className="hover:text-[#176B45] transition-colors">
              Resident Portal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
