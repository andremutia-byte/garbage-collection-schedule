import { getAdminStats } from "@/app/actions/admin";
import { AdminDashboardClient } from "./AdminDashboardClient";

export const metadata = {
  title: "Admin Dashboard — ButuanLinis",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return <AdminDashboardClient stats={stats} />;
}
