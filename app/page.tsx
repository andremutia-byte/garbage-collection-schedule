import { Show } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { SafeUserButton } from "@/components/SafeUserButton";
import Link from "next/link";
import Hero from "@/components/Hero";
import { getBarangays, getSchedulesByBarangay } from "@/app/actions/barangays";
import {
  BellRing,
  CalendarDays,
  MapPin,
  Recycle,
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
        <section id="how-it-works" className="bg-slate-50 py-20 sm:py-24 scroll-mt-16 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                How It Works
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600">
                A simple three-step process to stay on top of your
                community&apos;s waste management schedule.
              </p>
            </div>

            <div className="mt-14 mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/80 flex flex-col items-center text-center hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 border border-emerald-100">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    1. Register Address
                  </h3>
                  <p className="text-slate-600">
                    Create an account and register your household address to
                    track scheduled collections.
                  </p>
                </div>

                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/80 flex flex-col items-center text-center hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5 border border-blue-100">
                    <CalendarDays className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    2. View Schedule
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Instantly see your personalized calendar for general waste,
                    recycling, and green waste.
                  </p>
                </div>

                <div className="relative p-7 bg-white rounded-2xl shadow-xs border border-slate-200/80 flex flex-col items-center text-center hover:border-slate-300 hover:shadow-sm transition-all">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-5 border border-amber-100">
                    <BellRing className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    3. Get Reminders
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Opt-in to receive timely notifications the evening before
                    your collection day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Explanation */}
        <section id="categories" className="bg-white py-20 sm:py-24 overflow-hidden scroll-mt-16 border-t border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Keeping Butuan clean, together.
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                  We bridge the gap between municipal waste management and
                  residents across Butuan City. By providing a clear, accessible scheduling
                  platform, ButuanLinis helps reduce missed pickups, improve recycling rates,
                  and maintain cleaner streets for everyone.
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
                    <span className="text-sm font-medium">Up-to-date collection schedules for your address</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">Reliable automated reminders before collection day</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-5">
                    Waste Categories & Guidelines
                  </p>
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 flex-shrink-0">
                        <Recycle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Recycling</p>
                        <p className="text-xs text-slate-500">Paper, cardboard, clean plastics, glass, aluminum cans</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-700 flex-shrink-0">
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">General Household Waste</p>
                        <p className="text-xs text-slate-500">Non-recyclable domestic refuse, sanitary waste</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 flex-shrink-0">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Green & Biodegradable</p>
                        <p className="text-xs text-slate-500">Garden clippings, organic plant matter, compostable waste</p>
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
            <a href="#categories" className="hover:text-slate-900 transition-colors">
              Waste Types
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
