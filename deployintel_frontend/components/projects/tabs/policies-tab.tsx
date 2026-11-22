"use client";

import React, { useState } from "react";
import type { Project } from "@/lib/api/project";
import { 
  ShieldCheck, 
  Sliders, 
  Check, 
  AlertCircle, 
  Lock, 
  BellRing, 
  Save 
} from "lucide-react";

interface PoliciesTabProps {
  project: Project;
}

interface PolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: "BLOCK" | "WARN" | "ROLLBACK";
}

export function PoliciesTab({ project }: PoliciesTabProps) {
  const [riskThreshold, setRiskThreshold] = useState(65);
  const [isSaved, setIsSaved] = useState(false);

  const [policies, setPolicies] = useState<PolicyRule[]>([
    {
      id: "p1",
      name: "Pre-Flight ML Risk Score Gate",
      description: "Automatically halt pipeline if aggregate deployment risk index exceeds the selected threshold.",
      enabled: true,
      type: "BLOCK",
    },
    {
      id: "p2",
      name: "Canary Drift Auto-Rollback Watchdog",
      description: "Trigger instant rollback to previous healthy version if 5xx errors or latency degrade by 25% during canary phase.",
      enabled: true,
      type: "ROLLBACK",
    },
    {
      id: "p3",
      name: "Secret & Credential Sanitizer",
      description: "Block deployments containing unencrypted tokens, private keys, or high-entropy secrets in commit diffs.",
      enabled: true,
      type: "BLOCK",
    },
    {
      id: "p4",
      name: "Destructive Schema Migration Lock",
      description: "Require manual engineering lead sign-off for any DDL migration containing DROP TABLE, TRUNCATE, or column renames.",
      enabled: true,
      type: "BLOCK",
    },
    {
      id: "p5",
      name: "Flaky Test Auto-Quarantine",
      description: "Flag and isolate tests that fail intermittently across runs without stopping release gates.",
      enabled: false,
      type: "WARN",
    },
  ]);

  const togglePolicy = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* 1. Risk Threshold Slider Card */}
      <div className="bg-card text-foreground rounded-2xl border border-card-border p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#5850ec]" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                Risk Tolerance Threshold
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deployments scoring above this threshold will be quarantined and blocked automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground">Threshold:</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${
              riskThreshold <= 40
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : riskThreshold <= 70
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
            }`}>
              {riskThreshold} / 100
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-3">
          <input
            type="range"
            min={10}
            max={90}
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[#5850ec]"
          />
          <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
            <span>Strict (10)</span>
            <span>Balanced (50)</span>
            <span>Permissive (90)</span>
          </div>
        </div>
      </div>

      {/* 2. Guardrail Rules List */}
      <div className="bg-card text-foreground rounded-2xl border border-card-border shadow-xs overflow-hidden">
        <div className="p-6 border-b border-card-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Configured Sentinel Guardrails</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle active protection policies for {project.name}</p>
          </div>
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Policies Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>

        <div className="divide-y divide-card-border">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground">{policy.name}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      policy.type === "BLOCK"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20"
                        : policy.type === "ROLLBACK"
                        ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {policy.type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
                  {policy.description}
                </p>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={() => togglePolicy(policy.id)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  policy.enabled ? "bg-[#5850ec]" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    policy.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
