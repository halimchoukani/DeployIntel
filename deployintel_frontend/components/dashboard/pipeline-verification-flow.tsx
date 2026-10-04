"use client";

import React from "react";

const pipelineSteps = [
  {
    id: 1,
    label: "BUILD",
    sublabel: "Completed ✓ 42s",
    detail: "Artifact cached",
    status: "done",
  },
  {
    id: 2,
    label: "UNIT TESTS",
    sublabel: "98/98 passed",
    detail: "100% coverage delta",
    status: "done",
  },
  {
    id: 3,
    label: "SECURITY",
    sublabel: "0 Critical",
    detail: "SAST clean",
    status: "done",
  },
  {
    id: 4,
    label: "RISK SCORE",
    sublabel: "Score: 24 Low",
    detail: "Below safe 65",
    status: "done",
  },
  {
    id: 5,
    label: "AI ANALYSIS",
    sublabel: "No schema drift",
    detail: "Safe migration",
    status: "done",
  },
  {
    id: 6,
    label: "GATE VERDICT",
    sublabel: "ALLOWED ·",
    detail: "Auto-deploy sync",
    status: "active",
  },
];

export function PipelineVerificationFlow() {
  return (
    <section className="mb-6 bg-white rounded-xl border border-zinc-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#5850ec]">
                <path fillRule="evenodd" d="M2 11.5a.5.5 0 01.5-.5h14.086l-3.793-3.793a.5.5 0 11.707-.707l4.5 4.5a.5.5 0 010 .707l-4.5 4.5a.5.5 0 01-.707-.707L16.586 12H2.5a.5.5 0 01-.5-.5z" clipRule="evenodd" />
              </svg>
              <h2 className="text-sm font-semibold text-zinc-900">Active Pipeline Verification Flow</h2>
              <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">Pipeline #DP-9921</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Real-time gate telemetry for commit{" "}
              <span className="font-mono text-[#5850ec] underline cursor-pointer">chout1</span>{" "}
              targeting production us-east-1
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">All Gates Verified</span>
        </div>
      </div>

      {/* Pipeline steps */}
      <div className="flex items-start gap-0">
        {pipelineSteps.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1 min-w-0">
              {/* Step icon */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm ${
                  step.status === "active"
                    ? "bg-[#5850ec] shadow-[0_0_0_4px_rgba(88,80,236,0.15)]"
                    : "bg-[#5850ec]"
                }`}
              >
                {step.status === "active" ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>

              {/* Step label */}
              <div className="text-center mt-2 px-1">
                <p className={`text-[10px] font-bold uppercase tracking-wide ${step.status === "active" ? "text-[#5850ec]" : "text-zinc-700"}`}>
                  {step.id}. {step.label}
                </p>
                <p className={`text-[10px] mt-0.5 ${step.status === "active" ? "text-[#5850ec] font-semibold" : "text-zinc-500"}`}>
                  {step.sublabel}
                </p>
                <p className="text-[10px] text-zinc-400">{step.detail}</p>
              </div>
            </div>

            {/* Connector line */}
            {idx < pipelineSteps.length - 1 && (
              <div className="flex-shrink-0 w-8 h-0.5 bg-[#5850ec] mt-5 mx-1" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
