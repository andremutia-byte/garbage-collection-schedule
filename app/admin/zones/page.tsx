import { getAdminZones } from "@/app/actions/admin";
import { ZonesClient } from "./ZonesClient";

export const metadata = { title: "Zones — GCS Admin" };

export default async function ZonesPage() {
  const zones = await getAdminZones();
  return <ZonesClient zones={zones} />;
}
