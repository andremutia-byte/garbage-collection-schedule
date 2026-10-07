/**
 * Integration test runner page.
 * Calls the test logic directly (no HTTP round-trip) by importing
 * the shared test runner function.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { runIntegrationTests, type TestReport } from "@/lib/integration-tests";

export const metadata = { title: "Integration Tests — GCS" };
export const dynamic = "force-dynamic";

function StatusBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
      }`}
    >
      {passed ? "PASS" : "FAIL"}
    </span>
  );
}

export default async function IntegrationTestsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const report: TestReport = await runIntegrationTests(userId);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-emerald-600 hover:underline">← Home</Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">Integration Test Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            Server-side live tests against Clerk and Supabase.
          </p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-slate-900">{report.summary.total}</p>
            <p className="text-sm text-slate-500">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-emerald-200 p-4 text-center shadow-sm">
            <p className="text-3xl font-bold text-emerald-600">{report.summary.passed}</p>
            <p className="text-sm text-slate-500">Passed</p>
          </div>
          <div className={`bg-white rounded-xl border p-4 text-center shadow-sm ${report.summary.failed > 0 ? "border-red-200" : "border-slate-200"}`}>
            <p className={`text-3xl font-bold ${report.summary.failed > 0 ? "text-red-600" : "text-slate-400"}`}>
              {report.summary.failed}
            </p>
            <p className="text-sm text-slate-500">Failed</p>
          </div>
        </div>

        {/* Bootstrap note */}
        {report.bootstrapNote && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6">
            <p className="font-semibold text-amber-900 mb-2">⚠ Admin Bootstrap Required</p>
            <p className="text-sm text-amber-800 mb-3">{report.bootstrapNote.message}</p>
            <pre className="bg-amber-100 rounded-lg p-3 text-xs font-mono text-amber-900 overflow-x-auto whitespace-pre-wrap">
              {report.bootstrapNote.sql}
            </pre>
            <p className="text-xs text-amber-700 mt-2">
              Run in: Supabase Dashboard → SQL Editor → then refresh this page.
            </p>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          {report.results.map((r, i) => (
            <div
              key={i}
              className={`bg-white rounded-xl border p-4 shadow-sm ${
                r.passed ? "border-slate-200" : "border-red-200 bg-red-50/30"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-medium text-slate-900 text-sm">{r.name}</span>
                <StatusBadge passed={r.passed} />
              </div>
              <p className="text-xs text-slate-600">{r.detail}</p>
              {typeof r.bootstrapSQL === "string" && (
                <pre className="mt-2 bg-slate-100 rounded p-2 text-xs font-mono overflow-x-auto">
                  {r.bootstrapSQL}
                </pre>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-6 text-center">
          User: {report.summary.userId} · {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
}
