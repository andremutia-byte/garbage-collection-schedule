import { Suspense } from "react";
import { ScheduleClient } from "./ScheduleClient";
import { Loader2 } from "lucide-react";
import { getBarangays, getSchedulesByBarangay } from "@/app/actions/barangays";

export const metadata = {
  title: "Barangay Collection Schedule — ButuanLinis",
  description:
    "Check your barangay garbage collection schedule, pickup days, and waste segregation guidelines for Butuan City.",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ barangay?: string }>;
}) {
  const { barangay = "" } = await searchParams;
  const [barangaysList, initialData] = await Promise.all([
    getBarangays(),
    getSchedulesByBarangay(barangay),
  ]);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-slate-500">
              Loading schedule…
            </p>
          </div>
        </div>
      }
    >
      <ScheduleClient
        key={barangay}
        initialBarangays={barangaysList}
        initialSelectedBarangay={barangay}
        initialScheduleData={initialData}
      />
    </Suspense>
  );
}
