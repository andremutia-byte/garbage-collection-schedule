import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboardData, getZones } from "@/app/actions/dashboard";
import { getMyNotifications } from "@/app/actions/notifications";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "My Schedule — Garbage Collection Schedule",
  description: "View your upcoming garbage collection pickups and manage your registered addresses.",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch in parallel — notifications are independent of dashboard data
  const [data, zones, notifications] = await Promise.all([
    getDashboardData(),
    getZones(),
    getMyNotifications(),
  ]);

  if (!data) redirect("/sign-in");

  return <DashboardClient data={data} zones={zones} notifications={notifications} />;
}
