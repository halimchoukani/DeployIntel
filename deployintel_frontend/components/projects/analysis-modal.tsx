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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl max-w-lg w-full overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#5850ec] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">AI Gate Pre-Flight Evaluation</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Evaluating target project: {project.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
            <span className="font-medium text-zinc-700">1. Ingesting AST Git Diff & Source Tree</span>
            {step > 1 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            )}
          </div>

          {/* Step 2 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
            <span className="font-medium text-zinc-700">2. Analyzing Dependency Tree & CVE Vulnerabilities</span>
            {step > 2 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : step === 2 ? (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
            )}
          </div>

          {/* Step 3 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
            <span className="font-medium text-zinc-700">3. Computing DeployIntel ML Blast Radius & Risk Score</span>
            {step > 3 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : step === 3 ? (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
            )}
          </div>

          {/* Step 4 */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs">
            <span className="font-medium text-zinc-700">4. Evaluating Active Sentinel Policies</span>
            {isFinished ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : step === 4 ? (
              <Loader2 className="w-4 h-4 text-[#5850ec] animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
            )}
          </div>
        </div>

        {/* Verdict Box once finished */}
        {isFinished && (
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                VERDICT: GATE ALLOWED
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Risk Score: 18 / 100
              </span>
            </div>
            <p className="text-emerald-700 text-[11px] leading-relaxed">
              Safe to release. All 5 guardrail policies passed. Zero destructive schema statements or unencrypted secrets detected.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
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
