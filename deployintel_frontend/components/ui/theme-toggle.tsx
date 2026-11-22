"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className = "", showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("w-8 h-8 rounded-lg bg-muted animate-pulse", className)} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex items-center justify-center w-8 h-8 rounded-lg border border-card-border",
        "bg-card text-foreground",
        "hover:bg-muted hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "transition-all duration-200",
        "dark:bg-card dark:border-card-border dark:text-foreground",
        className
      )}
    >
      <span className="absolute transition-all duration-300 ease-out">
        {isDark ? (
          <Sun className="w-4 h-4 text-warning rotate-0 scale-100" />
        ) : (
          <Moon className="w-4 h-4 text-muted-foreground -rotate-12 scale-100" />
        )}
      </span>
      {showLabel && (
        <span className="sr-only">
          {isDark ? "Switch to light mode" : "Switch to dark mode"}
        </span>
      )}
    </button>
  );
}

interface ThemeSelectorProps {
  className?: string;
  variant?: "dropdown" | "segmented" | "cards";
}

export function ThemeSelector({ className = "", variant = "segmented" }: ThemeSelectorProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("h-10 w-full rounded-xl bg-muted animate-pulse", className)} />
    );
  }

  const options = [
    { value: "light", label: "Light", icon: Sun, description: "Always light" },
    { value: "dark", label: "Dark", icon: Moon, description: "Always dark" },
    { value: "system", label: "System", icon: Monitor, description: "Match OS" },
  ];

  const currentResolved = resolvedTheme === "dark" ? "dark" : "light";

  if (variant === "dropdown") {
    return (
      <div className={cn("relative inline-block", className)}>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg border border-card-border",
            "bg-card text-foreground",
            "hover:bg-muted hover:shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "transition-all duration-200",
            "dark:bg-card dark:border-card-border dark:text-foreground"
          )}
          aria-haspopup="listbox"
          aria-expanded="false"
        >
          <Sun className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium capitalize">{theme}</span>
          <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid grid-cols-3 gap-3", className)} role="radiogroup" aria-label="Theme selection">
        {options.map((opt) => {
          const Icon = opt.icon;
          const active = theme === opt.value;
          const resolvedActive = opt.value === "system" ? true : opt.value === currentResolved;

          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                active
                  ? "border-ring bg-ring/10 shadow-sm"
                  : "border-card-border bg-card hover:border-accent/50 hover:bg-muted/50",
                "dark:border-card-border dark:bg-card dark:hover:border-accent/50 dark:hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all",
                active ? "bg-ring text-ring-foreground" : "bg-muted text-muted-foreground"
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={cn(
                "text-sm font-semibold transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}>
                {opt.label}
              </span>
              <span className={cn(
                "text-[10px] font-medium transition-colors",
                active ? "text-ring/80" : "text-muted-foreground"
              )}>
                {opt.description}
              </span>
              {active && (
                <Check className="absolute top-2 right-2 w-4 h-4 text-ring" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: segmented control
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-xl border border-card-border",
        "bg-muted dark:bg-muted",
        className
      )}
      role="radiogroup"
      aria-label="Theme selection"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold",
              "transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
              active
                ? "bg-card text-foreground shadow-xs border border-card-border"
                : "text-muted-foreground hover:text-foreground",
              "dark:bg-card dark:border-card-border dark:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// Export a compact version for tight spaces
export function ThemeToggleCompact({ className = "" }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn("w-7 h-7 rounded-lg bg-muted animate-pulse", className)} />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Light mode" : "Dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex items-center justify-center w-7 h-7 rounded-lg",
        "bg-muted text-muted-foreground",
        "hover:bg-muted/80 hover:text-foreground hover:shadow-sm",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "transition-all duration-200",
        "dark:bg-muted dark:text-muted-foreground",
        className
      )}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-warning" />
      ) : (
        <Moon className="w-3.5 h-3.5" />
      )}
    </button>
  );
}