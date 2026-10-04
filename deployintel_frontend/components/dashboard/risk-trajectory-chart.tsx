"use client";

import React from "react";

// A simple SVG line chart for the 30-day deployment risk trajectory
export function RiskTrajectoryChart() {
  // Points representing the risk trajectory data
  const points = [
    { x: 0, y: 55 },
    { x: 5, y: 50 },
    { x: 10, y: 40 },
    { x: 15, y: 35 },
    { x: 20, y: 28 },
    { x: 25, y: 25 },
    { x: 30, y: 30 },
    { x: 35, y: 20 },
    { x: 45, y: 18 },
    { x: 55, y: 22 },
    { x: 65, y: 35 },
    { x: 75, y: 50 },
    { x: 85, y: 70 },
    { x: 90, y: 80 },
    { x: 95, y: 75 },
    { x: 100, y: 55 },
    { x: 108, y: 40 },
    { x: 115, y: 30 },
    { x: 120, y: 18 },
    { x: 130, y: 15 },
    { x: 140, y: 18 },
    { x: 150, y: 22 },
    { x: 160, y: 30 },
    { x: 165, y: 40 },
  ];

  const width = 480;
  const height = 120;
  const padding = { top: 16, right: 20, bottom: 20, left: 20 };

  // Normalize points to SVG coordinates
  const maxX = 165;
  const minY = 10;
  const maxY = 95;

  const toSVG = (px: number, py: number) => ({
    x: padding.left + (px / maxX) * (width - padding.left - padding.right),
    y: padding.top + ((maxY - py) / (maxY - minY)) * (height - padding.top - padding.bottom),
  });

  const svgPoints = points.map((p) => toSVG(p.x, p.y));

  // Build smooth path using cubic bezier
  const pathD = svgPoints.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = svgPoints[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX},${prev.y} ${cpX},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  // Fill below the line
  const firstPt = svgPoints[0];
  const lastPt = svgPoints[svgPoints.length - 1];
  const fillD = `${pathD} L ${lastPt.x},${height - padding.bottom} L ${firstPt.x},${height - padding.bottom} Z`;

  // Threshold line Y
  const thresholdSVGY = toSVG(0, 65).y;
  // Peak point (highest y value before normalization = lowest on screen)
  const peakPt = toSVG(90, 80);

  return (
    <section className="bg-white rounded-xl border border-zinc-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#5850ec]">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd" />
            </svg>
            <h2 className="text-sm font-semibold text-zinc-900">30-Day Deployment Risk Trajectory</h2>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Continuous scoring history against the automated firewall trip threshold
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-red-400 block rounded" />
            <span className="text-[10px] text-zinc-500">Gate 65 (Block)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-6 h-0.5 bg-[#5850ec] block rounded" />
            <span className="text-[10px] text-zinc-500">Score Trend</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: "140px" }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5850ec" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#5850ec" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Threshold dashed line */}
          <line
            x1={padding.left}
            y1={thresholdSVGY}
            x2={width - padding.right}
            y2={thresholdSVGY}
            stroke="#ef4444"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.6"
          />
          <text x={width - padding.right - 2} y={thresholdSVGY - 4} fontSize="8" fill="#ef4444" textAnchor="end" opacity="0.8">
            THRESHOLD: 65
          </text>

          {/* Fill area */}
          <path d={fillD} fill="url(#riskGradient)" />

          {/* Main line */}
          <path d={pathD} fill="none" stroke="#5850ec" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Peak dot */}
          <circle cx={peakPt.x} cy={peakPt.y} r="4" fill="#ef4444" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-zinc-100">
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Rolling 30D Avg</p>
          <p className="text-lg font-bold text-zinc-900 mt-0.5">34.2</p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Peak Spike</p>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-lg font-bold text-red-600">88 Risk</p>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-red-500">
              <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-zinc-400 uppercase tracking-wider">Total Gate Blocks</p>
          <p className="text-lg font-bold text-zinc-900 mt-0.5">7 Intercepted</p>
        </div>
      </div>
    </section>
  );
}
