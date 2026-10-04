import type { Metadata } from "next";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";

export const metadata: Metadata = {
  title: "Settings - DeployIntel",
  description: "Manage your personal information, developer credentials, and account preferences.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Sidebar />
      <DashboardTopbar />
      <main className="ml-[220px] pt-14 min-h-[calc(100vh-3.5rem)] flex">
        <SettingsSidebar />
        <div className="flex-1 bg-[#fcfcfc] border-l border-zinc-200">
          {children}
        </div>
      </main>
    </div>
  );
}
