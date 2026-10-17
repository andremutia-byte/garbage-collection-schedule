import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Recycle } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign Up — ButuanLinis",
  description: "Create an account on ButuanLinis — A Cleaner Butuan, One Collection at a Time.",
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-6 flex flex-col items-center gap-1.5 text-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
            <Recycle className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
            ButuanLinis
          </span>
        </Link>
        <p className="text-xs text-slate-500 font-medium">
          “A Cleaner Butuan, One Collection at a Time.”
        </p>
      </div>
      <div className="w-full max-w-md">
        <div className="mb-4 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-center text-xs text-emerald-900 shadow-2xs">
          <p className="font-semibold text-emerald-800">Account Security Requirement</p>
          <p className="mt-0.5 text-emerald-700/90">
            Passwords must be at least 8 characters long (Clerk enforces 8+ characters).
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
