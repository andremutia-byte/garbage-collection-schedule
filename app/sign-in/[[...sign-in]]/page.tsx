import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Recycle } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — ButuanLinis",
  description: "Sign in to ButuanLinis — A Cleaner Butuan, One Collection at a Time.",
};

export default function SignInPage() {
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
        <SignIn />
      </div>
    </div>
  );
}
