import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAdminAuth } from "@/lib/admin-auth";
import { AdminSidebar } from "./AdminSidebar";

export const metadata = {
  title: "Admin — Garbage Collection Schedule",
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { isAdmin } = await getAdminAuth();
  if (!isAdmin) redirect("/unauthorized");

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
