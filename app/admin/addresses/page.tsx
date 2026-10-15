import { getAdminAddresses } from "@/app/actions/admin";
import { AddressesClient } from "./AddressesClient";

export const metadata = { title: "Addresses — GCS Admin" };

export default async function AddressesPage() {
  const addresses = await getAdminAddresses();
  return <AddressesClient addresses={addresses} />;
}
