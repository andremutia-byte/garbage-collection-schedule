import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDashboardData } from "@/app/actions/dashboard";
import { getMyNotifications } from "@/app/actions/notifications";
import { DashboardClient } from "./DashboardClient";

export const metadata = {
  title: "My Schedule — ButuanLinis",
  description: "View your upcoming garbage collection pickups and manage your registered addresses in Butuan City.",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Fetch in parallel — notifications are independent of dashboard data
  const [data, notifications] = await Promise.all([
    getDashboardData(),
    getMyNotifications(),
  ]);

  if (!data) redirect("/sign-in");

  return <DashboardClient data={data} notifications={notifications} />;
}
