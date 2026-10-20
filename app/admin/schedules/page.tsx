import {
  getAdminSchedules,
  getAdminCategories,
  getAdminPickups,
  getAdminAddressList,
  getAdminBarangays,
} from "@/app/actions/admin";
import { SchedulesClient } from "./SchedulesClient";

export const metadata = { title: "Schedules — ButuanLinis Admin" };

export default async function SchedulesPage() {
  const [schedules, categories, pickups, addresses, barangays] = await Promise.all([
    getAdminSchedules(),
    getAdminCategories(),
    getAdminPickups(100),
    getAdminAddressList(),
    getAdminBarangays(),
  ]);

  return (
    <SchedulesClient
      schedules={schedules}
      categories={categories}
      pickups={pickups}
      addresses={addresses}
      barangays={barangays}
    />
  );
}
