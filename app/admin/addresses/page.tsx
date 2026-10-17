import { getAdminAddresses } from "@/app/actions/admin";
import { AddressesClient } from "./AddressesClient";

export const metadata = { title: "Addresses — ButuanLinis Admin" };

export default async function AddressesPage() {
  const addresses = await getAdminAddresses();
  return <AddressesClient addresses={addresses} />;
}
