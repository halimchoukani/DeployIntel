import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export const metadata: Metadata = {
  title: "Dashboard - DeployIntel",
  description: "Monitor deployment risk, gate verdicts, and telemetry across all your pipelines.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <DashboardTopbar />
      <main className="ml-[220px] pt-14 min-h-screen">
        {children}
      </main>
    </div>
  );
}
