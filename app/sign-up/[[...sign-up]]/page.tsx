import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Recycle } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
          <Recycle className="h-5 w-5" />
        </div>
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-emerald-700 transition-colors">
          Garbage Collection Schedule
        </Link>
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
