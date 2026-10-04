"use client";

import React from "react";

export function ZeroStatePreview() {
  return (
    <section className="bg-white rounded-xl border border-zinc-200 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-zinc-500">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <h2 className="text-sm font-semibold text-zinc-900">Zero-State Preview</h2>
        </div>
        <span className="text-[10px] font-semibold bg-zinc-100 text-zinc-500 px-2 py-1 rounded-lg">Sandbox Mode</span>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed mb-5">
        Interface state when establishing a fresh isolated pipeline environment
      </p>

      {/* Empty state illustration */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 border border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
        <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 text-zinc-400">
            <path d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-zinc-600">No deployments yet</p>
        <p className="text-[11px] text-zinc-400 mt-1 text-center max-w-[200px] leading-relaxed">
          Create your first deployment analysis or connect your GitHub/GitLab webhook.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <button className="flex-1 text-xs font-medium text-zinc-600 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 px-3 py-2 rounded-lg transition-colors">
          Read Docs
        </button>
        <button className="flex-1 text-xs font-semibold text-white bg-[#5850ec] hover:bg-[#4d44e7] px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v6.5h6.5a.75.75 0 010 1.5h-6.5v6.5a.75.75 0 01-1.5 0v-6.5h-6.5a.75.75 0 010-1.5h6.5v-6.5A.75.75 0 0110 3z" clipRule="evenodd" />
          </svg>
          Connect Repo
        </button>
      </div>

      {/* CLI hint */}
      <div className="mt-3 flex items-center gap-1.5">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-[#5850ec]">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
        </svg>
        <span className="text-[10px] text-zinc-400">
          CLI fast start:{" "}
          <code className="font-mono text-[#5850ec] bg-indigo-50 px-1 py-0.5 rounded">deployintel_init</code>
        </span>
      </div>
    </section>
  );
}
