"use client";

import React, { useState, useEffect } from "react";
import type { Project } from "@/lib/api/project";
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  X, 
  Zap, 
  ArrowRight,
  Cpu
} from "lucide-react";

interface AnalysisModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function AnalysisModal({ project, isOpen, onClose }: AnalysisModalProps) {
  const [step, setStep] = useState<number>(1);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setIsFinished(false);
      return;
    }

    // Step progression animation
    const t1 = setTimeout(() => setStep(2), 700);
    const t2 = setTimeout(() => setStep(3), 1500);
    const t3 = setTimeout(() => setStep(4), 2300);
    const t4 = setTimeout(() => setIsFinished(true), 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-card text-foreground rounded-2xl border border-card-border shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-[#5850ec] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">AI Gate Pre-Flight Evaluation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Evaluating target project: {project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-card-border text-xs">
            <span className="font-medium text-foreground">1. Ingesting AST Git Diff & Source Tree</span>
            {step > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            )}
          </div>

          {/* Step 2 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-card-border text-xs">
            <span className="font-medium text-foreground">2. Analyzing Dependency Tree & CVE Vulnerabilities</span>
            {step > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : step === 2 ? (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            )}
          </div>

          {/* Step 3 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-card-border text-xs">
            <span className="font-medium text-foreground">3. Computing DeployIntel ML Blast Radius & Risk Score</span>
            {step > 3 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : step === 3 ? (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            )}
          </div>

          {/* Step 4 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-card-border text-xs">
            <span className="font-medium text-foreground">4. Evaluating Active Sentinel Policies</span>
            {isFinished ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : step === 4 ? (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
            )}
          </div>
        </div>

        {/* Verdict Box once finished */}
        {isFinished && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                VERDICT: GATE ALLOWED
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Risk Score: 18 / 100
              </span>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300/90 text-[11px] leading-relaxed">
              Safe to release. All 5 guardrail policies passed. Zero destructive schema statements or unencrypted secrets detected.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
          >
            Dismiss
          </button>
          {isFinished && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] rounded-xl transition-colors shadow-xs"
            >
              Confirm Release
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
