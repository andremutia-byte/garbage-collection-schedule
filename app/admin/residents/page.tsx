import { getAdminResidents } from "@/app/actions/admin";
import { ResidentsClient } from "./ResidentsClient";

export const metadata = { title: "Residents — GCS Admin" };

export default async function ResidentsPage() {
  const residents = await getAdminResidents();
  return <ResidentsClient residents={residents} />;
}
