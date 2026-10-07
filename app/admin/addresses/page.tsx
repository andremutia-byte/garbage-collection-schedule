import { getAdminAddresses, getAdminZones } from "@/app/actions/admin";
import { AddressesClient } from "./AddressesClient";

export const metadata = { title: "Addresses — GCS Admin" };

export default async function AddressesPage() {
  const [addresses, zones] = await Promise.all([getAdminAddresses(), getAdminZones()]);
  return <AddressesClient addresses={addresses} zones={zones} />;
}
