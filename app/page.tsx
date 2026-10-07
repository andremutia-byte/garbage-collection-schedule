"use client";

import { Show } from "@clerk/nextjs";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  MapPin,
  Recycle,
  Trash2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
              <Recycle className="h-5 w-5" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
              Garbage Collection Schedule
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <a
              href="#how-it-works"
              className="hidden md:inline-block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </a>
            <a
              href="#categories"
              className="hidden md:inline-block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Waste Types
            </a>
            <Show
              when="signed-out"
              fallback={
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 px-3.5 py-1.5 transition-colors shadow-xs"
                  >
                    My Schedule <ArrowRight className="h-4 w-4" />
                  </Link>
                  <UserButton />
                </div>
              }
            >
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all hover:shadow-sm">
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </Show>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white pt-20 pb-28 sm:pt-24 sm:pb-32">
          {/* Subtle background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-xs sm:text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Municipal Waste Management Portal
            </div>
            <h1 className="mx-auto max-w-4xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Never Miss a{" "}
              <span className="text-emerald-600">Garbage Collection</span> Day
              Again
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
              The smart, reliable way for residents to check their waste and
              recycling schedules. Register your address once, and let us handle
              the rest.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Show
                when="signed-in"
                fallback={
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                      View My Schedule
                    </button>
                  </SignUpButton>
                }
              >
                <Link
                  href="/dashboard"
                  className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm sm:text-base font-semibold text-white shadow-xs hover:bg-emerald-700 transition-all hover:scale-[1.02] active:scale-[0.98] inline-block"
                >
                  View My Schedule
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm sm:text-base font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer">
                    Sign In
                  </button>
                </SignInButton>
              </Show>
            </div>
          </div>
        </section>

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
                    Create an account and link your residential address to your
                    municipal waste zone.
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
                  Keeping our community clean, together.
                </h2>
                <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600">
                  We bridge the gap between municipal waste management and
                  residents. By providing a clear, accessible scheduling
                  platform, we reduce missed pickups, improve recycling rates,
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
                    <span className="text-sm font-medium">Up-to-date schedules for your collection zone</span>
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
              Ready to simplify your collection schedule?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              Register once and always know when to put the bins out.
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
          <div className="flex items-center gap-2">
            <Recycle className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold text-slate-900">
              Garbage Collection Schedule
            </span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Garbage Collection Schedule. All rights reserved.
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
