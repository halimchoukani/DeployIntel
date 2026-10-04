"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
    color?: "green" | "red" | "blue";
  };
  badge?: {
    label: string;
    color: "red" | "yellow" | "green" | "blue";
  };
  action?: {
    label: string;
    href?: string;
  };
  statusDot?: {
    color: "red" | "green" | "yellow";
    label: string;
  };
}

const badgeColors = {
  red: "bg-red-100 text-red-700",
  yellow: "bg-amber-100 text-amber-700",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
};

const trendColors = {
  green: "text-emerald-600 bg-emerald-50",
  red: "text-red-600 bg-red-50",
  blue: "text-blue-600 bg-blue-50",
};

const dotColors = {
  red: "bg-red-400",
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
};

export function StatCard({ label, value, subtitle, trend, badge, action, statusDot }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest leading-tight">{label}</p>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${trendColors[trend.color ?? "green"]}`}>
            {trend.direction === "up" ? (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-2.5 h-2.5">
                <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
              </svg>
            )}
            {trend.value}
          </span>
        )}
        {badge && (
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${badgeColors[badge.color]}`}>
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-zinc-900 leading-none">{value}</p>
          {subtitle && <p className="text-[11px] text-zinc-400 mt-1">{subtitle}</p>}
        </div>
      </div>

      {(action || statusDot) && (
        <div className="flex items-center justify-between mt-auto pt-1 border-t border-zinc-50">
          {statusDot && (
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dotColors[statusDot.color]}`} />
              <span className="text-[10px] text-zinc-400">{statusDot.label}</span>
            </div>
          )}
          {action && (
            <button className="text-[10px] font-medium text-[#5850ec] hover:underline flex items-center gap-0.5 ml-auto">
              {action.label}
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
