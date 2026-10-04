"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsSidebar() {
  const pathname = usePathname();

  const accountLinks = [
    { name: "Profile", href: "/settings/profile", icon: <UserIcon /> },
    { name: "Security & 2FA", href: "/settings/security", icon: <ShieldIcon /> },
    { name: "Notifications", href: "/settings/notifications", icon: <BellIcon /> },
    { name: "Preferences", href: "/settings/preferences", icon: <SlidersIcon /> },
  ];

  const workspaceLinks = [
    { name: "Team & Roles", href: "/settings/team", icon: <UsersIcon /> },
    { name: "Integrations", href: "/settings/integrations", icon: <BlocksIcon />, badge: 4 },
    { name: "API Keys", href: "/settings/keys", icon: <KeyIcon /> },
    { name: "Audit Logs", href: "/settings/audit", icon: <FileTextIcon /> },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 pt-6 px-6">
      <div className="mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 px-2">Account</h3>
        <ul className="space-y-0.5">
          {accountLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100/80 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <span className={isActive ? "text-[#5850ec]" : "text-zinc-400"}>{link.icon}</span>
                  <span className="flex-1">{link.name}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#5850ec]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mb-8">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 px-2">Workspace</h3>
        <ul className="space-y-0.5">
          {workspaceLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100/80 text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <span className={isActive ? "text-[#5850ec]" : "text-zinc-400"}>{link.icon}</span>
                  <span className="flex-1">{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 font-semibold px-1.5 py-0.5 rounded">
                      {link.badge}
                    </span>
                  )}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#5850ec]" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Fast Actions Card */}
      <div className="bg-zinc-50 rounded-xl border border-zinc-100 p-4">
        <div className="flex items-center gap-1.5 mb-2 text-[#5850ec] font-semibold text-xs uppercase tracking-wider">
          <ZapIcon />
          <span>Fast Actions</span>
        </div>
        <p className="text-[11px] text-zinc-500 mb-3 leading-snug">
          Export personal audit diff or roll personal SSH keys.
        </p>
        <button className="w-full h-8 bg-zinc-200/50 hover:bg-zinc-200 text-zinc-700 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors">
          <DownloadIcon />
          Export Audit Pack
        </button>
      </div>
    </aside>
  );
}

// Icons
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function BlocksIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}
function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
function ZapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
