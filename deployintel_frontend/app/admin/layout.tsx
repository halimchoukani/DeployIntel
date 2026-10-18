import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { AdminGuard } from "@/components/admin/admin-guard";

export const metadata: Metadata = {
  title: "Platform Administration - DeployIntel",
  description: "Administrative console for managing users, projects, and platform analytics.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <DashboardTopbar />
      <main className="ml-[220px] pt-14 min-h-screen">
        <AdminGuard>{children}</AdminGuard>
      </main>
    </div>
  );
}
