import {
  getAdminSchedules,
  getAdminZones,
  getAdminCategories,
  getAdminPickups,
  getAdminAddressList,
} from "@/app/actions/admin";
import { SchedulesClient } from "./SchedulesClient";

export const metadata = { title: "Schedules — GCS Admin" };

export default async function SchedulesPage() {
  const [schedules, zones, categories, pickups, addresses] = await Promise.all([
    getAdminSchedules(),
    getAdminZones(),
    getAdminCategories(),
    getAdminPickups(100),
    getAdminAddressList(),
  ]);

  return (
    <SchedulesClient
      schedules={schedules}
      zones={zones}
      categories={categories}
      pickups={pickups}
      addresses={addresses}
    />
  );
}
