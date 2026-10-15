import {
  getAdminSchedules,
  getAdminCategories,
  getAdminPickups,
  getAdminAddressList,
} from "@/app/actions/admin";
import { SchedulesClient } from "./SchedulesClient";

export const metadata = { title: "Schedules — GCS Admin" };

export default async function SchedulesPage() {
  const [schedules, categories, pickups, addresses] = await Promise.all([
    getAdminSchedules(),
    getAdminCategories(),
    getAdminPickups(100),
    getAdminAddressList(),
  ]);

  return (
    <SchedulesClient
      schedules={schedules}
      categories={categories}
      pickups={pickups}
      addresses={addresses}
    />
  );
}
