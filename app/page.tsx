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
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Recycle className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Garbage Collection Schedule
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Show
              when="signed-out"
              fallback={
                <div className="flex items-center gap-4">
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors items-center gap-1"
                  >
                    My Schedule <ArrowRight className="h-4 w-4" />
                  </Link>
                  <UserButton />
                </div>
              }
            >
              <div className="flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="hidden sm:block text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">
                    Log in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors">
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
        <section className="relative overflow-hidden bg-white pt-24 pb-32">
          {/* Subtle background grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Municipal Waste Management Portal
            </div>
            <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Never Miss a{" "}
              <span className="text-emerald-600">Garbage Collection</span> Day
              Again
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              The smart, reliable way for residents to check their waste and
              recycling schedules. Register your address once, and let us handle
              the rest.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
              <Show
                when="signed-in"
                fallback={
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95">
                      View My Schedule
                    </button>
                  </SignUpButton>
                }
              >
                <Link
                  href="/dashboard"
                  className="rounded-full bg-emerald-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 inline-block"
                >
                  View My Schedule
                </Link>
              </Show>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors">
                    Sign In
                  </button>
                </SignInButton>
              </Show>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-slate-50 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                How It Works
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                A simple three-step process to stay on top of your
                community&apos;s waste management schedule.
              </p>
            </div>

            <div className="mt-16 mx-auto max-w-5xl">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div className="relative p-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
                    <MapPin className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    1. Register Address
                  </h3>
                  <p className="text-slate-600">
                    Create an account and link your residential address to your
                    municipal waste zone.
                  </p>
                </div>

                <div className="relative p-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-6">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    2. View Schedule
                  </h3>
                  <p className="text-slate-600">
                    Instantly see your personalized calendar for general waste,
                    recycling, and green waste.
                  </p>
                </div>

                <div className="relative p-8 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-6">
                    <BellRing className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    3. Get Reminders
                  </h3>
                  <p className="text-slate-600">
                    Opt-in to receive timely notifications the evening before
                    your collection day.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Explanation */}
        <section className="bg-white py-24 overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Keeping our community clean, together.
                </h2>
                <p className="mt-6 text-lg leading-8 text-slate-600">
                  We bridge the gap between municipal waste management and
                  residents. By providing a clear, accessible scheduling
                  platform, we reduce missed pickups, improve recycling rates,
                  and maintain cleaner streets for everyone.
                </p>
                <ul className="mt-8 space-y-4 text-slate-600">
                  <li className="flex gap-3 items-center">
                    <Trash2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Clear distinction between waste categories</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <CalendarDays className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Up-to-date schedules for your collection zone</span>
                  </li>
                  <li className="flex gap-3 items-center">
                    <BellRing className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                    <span>Reliable automated reminders before collection day</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 rounded-xl bg-slate-100/50 transform rotate-2" />
                <div className="relative rounded-xl bg-white border border-slate-200 shadow-xl p-8">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6">
                    Waste Categories
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 flex-shrink-0">
                        <Recycle className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Recycling</p>
                        <p className="text-sm text-slate-500">Paper, plastic, glass, cans</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 flex-shrink-0">
                        <Trash2 className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">General Waste</p>
                        <p className="text-sm text-slate-500">Non-recyclable household waste</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 flex-shrink-0">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">Green Waste</p>
                        <p className="text-sm text-slate-500">Garden clippings, organic matter</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-emerald-900 py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to simplify your collection schedule?
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-emerald-200">
              Register once and always know when to put the bins out.
            </p>
            <div className="mt-10 flex justify-center">
              <Show
                when="signed-in"
                fallback={
                  <SignUpButton mode="modal">
                    <button className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50 transition-colors">
                      Register Your Address
                    </button>
                  </SignUpButton>
                }
              >
                <Link
                  href="/dashboard"
                  className="rounded-full bg-white px-8 py-3.5 text-base font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50 transition-colors inline-block"
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
            <a href="#" className="hover:text-slate-900 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-900 transition-colors">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
