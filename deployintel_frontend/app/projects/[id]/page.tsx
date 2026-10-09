"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useProject } from "@/hooks/use-projects";
import type { Project } from "@/lib/api/project";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectKpis } from "@/components/projects/project-kpis";
import { OverviewTab } from "@/components/projects/tabs/overview-tab";
import { CommitsTab } from "@/components/projects/tabs/commits-tab";
import { DeploymentsTab } from "@/components/projects/tabs/deployments-tab";
import { InsightsTab } from "@/components/projects/tabs/insights-tab";
import { PoliciesTab } from "@/components/projects/tabs/policies-tab";
import { SettingsTab } from "@/components/projects/tabs/settings-tab";
import { AnalysisModal } from "@/components/projects/analysis-modal";
import { 
  Activity, 
  GitCommit,
  Layers, 
  Sparkles, 
  Sliders, 
  Settings, 
  Clock,
  ArrowLeft
} from "lucide-react";

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const { data: liveProject, isLoading, error } = useProject(id);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);

  // Read URL tab query parameter on mount if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab && ["overview", "commits", "deployments", "insights", "policies", "settings"].includes(urlTab)) {
        setActiveTab(urlTab);
      }
    }
  }, []);

  // If liveProject is not found (e.g. during frontend design preview or mock), provide realistic fallback
  const project: Project = liveProject || {
    id: id || "proj-dev-01",
    name: "Checkout Core Service",
    description: "High-throughput microservice handling customer transactions, payment gateways, and tokenized authorization.",
    repositoryUrl: "https://github.com/deployintel/checkout-engine",
    defaultBranch: "main",
    language: "TypeScript",
    ownerId: "user-1",
    status: "ACTIVE",
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  };

  const tabs = [
    { id: "overview", label: "Overview & Health", icon: Activity },
    { id: "commits", label: "Commits", icon: GitCommit, count: 8 },
    { id: "deployments", label: "Deployments", icon: Layers, count: 5 },
    { id: "insights", label: "AI Blast Radius", icon: Sparkles },
    { id: "policies", label: "Gate Guardrails", icon: Sliders },
    { id: "settings", label: "CI/CD & Settings", icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="px-8 py-12 max-w-[1400px]">
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-8 h-8 border-3 border-zinc-200 border-t-[#5850ec] rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Loading project telemetry & gate policies…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto min-h-screen">
      {/* 1. Project Hero Header */}
      <ProjectHeader
        project={project}
        onRunAnalysis={() => setIsAnalysisModalOpen(true)}
      />

      {/* 2. Key Performance Indicators */}
      <ProjectKpis
        riskScore={18}
        approvalRate="97.4%"
        mttv="1.8s"
        activePolicies={5}
      />

      {/* 3. Navigation Tabs */}
      <div className="border-b border-zinc-200 mb-6 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-[#5850ec] text-[#5850ec]"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#5850ec]" : "text-zinc-400"}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-indigo-50 text-[#5850ec]" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live sync indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 pb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Real-time telemetry connected</span>
        </div>
      </div>

      {/* 4. Active Tab Content */}
      <div className="animate-in fade-in duration-150">
        {activeTab === "overview" && (
          <OverviewTab
            project={project}
            onOpenAnalysis={() => setIsAnalysisModalOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === "commits" && (
          <CommitsTab
            project={project}
            onRunAnalysis={() => setIsAnalysisModalOpen(true)}
          />
        )}
        {activeTab === "deployments" && (
          <DeploymentsTab project={project} />
        )}
        {activeTab === "insights" && (
          <InsightsTab project={project} />
        )}
        {activeTab === "policies" && (
          <PoliciesTab project={project} />
        )}
        {activeTab === "settings" && (
          <SettingsTab project={project} />
        )}
      </div>

      {/* 5. Interactive Gate Analysis Simulator Modal */}
      <AnalysisModal
        project={project}
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
      />
    </div>
  );
}
