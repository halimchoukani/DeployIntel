"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Bot,
  ChevronDown,
  ChevronUp,
  Terminal,
  Info,
} from "lucide-react";

interface AiSuggestionCardProps {
  suggestion?: string | null;
  model?: string | null;
  title?: string;
  onRegenerate?: () => Promise<void> | void;
  isRegenerating?: boolean;
}

function CodeSnippetBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
        <span className="uppercase font-semibold tracking-wider text-indigo-400 flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-indigo-400" />
          {language || "code"}
        </span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 hover:text-white px-2 py-0.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[11px] font-mono leading-relaxed text-zinc-200">
        <pre className="m-0 p-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export function AiSuggestionCard({
  suggestion,
  model = "qwen2.5-coder:7b",
  title = "Local Ollama AI Diagnostics & Remediation",
  onRegenerate,
  isRegenerating = false,
}: AiSuggestionCardProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!suggestion && !onRegenerate) {
    return null;
  }

  const handleCopy = () => {
    if (!suggestion) return;
    navigator.clipboard.writeText(suggestion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-indigo-200/90 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 via-purple-50/20 to-card dark:from-indigo-950/20 dark:via-purple-950/10 dark:to-card shadow-xs overflow-hidden transition-all text-xs">
      {/* Header bar */}
      <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-indigo-100/80 dark:border-indigo-900/40 bg-card/60 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-foreground text-xs sm:text-sm">{title}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <Bot className="w-3 h-3" />
                {model || "qwen2.5-coder:7b"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to Local Ollama AI Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {suggestion && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-card-border bg-card hover:bg-muted text-foreground transition-colors text-[11px] font-medium shadow-2xs cursor-pointer"
              title="Copy full analysis as markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
              <span>{copied ? "Copied" : "Copy Markdown"}</span>
            </button>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-[11px] transition-colors disabled:opacity-50 shadow-2xs shadow-indigo-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>{isRegenerating ? "Analyzing..." : suggestion ? "Regenerate" : "Consult Ollama AI"}</span>
            </button>
          )}

          {suggestion && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-1 cursor-pointer"
              title={collapsed ? "Expand analysis" : "Collapse analysis"}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Suggestion Body with Full Markdown Support */}
      {!collapsed && (
        <div className="p-4 sm:p-6 bg-card/80">
          {isRegenerating && !suggestion ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs font-semibold text-foreground">Synthesizing test report with Ollama {model}...</p>
              <p className="text-[11px] text-muted-foreground max-w-sm text-center">
                Analyzing test logs, vulnerability paths, and SLA percentiles to formulate actionable code patches and recommendations.
              </p>
            </div>
          ) : suggestion ? (
            <div className="markdown-content text-foreground leading-relaxed font-sans">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-sm font-bold text-foreground border-b border-indigo-100 dark:border-indigo-900/50 pb-1.5 mt-4 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-full inline-block shrink-0" />
                      <span>{children}</span>
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xs font-bold text-foreground mt-3.5 mb-1.5 flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-indigo-500 dark:bg-indigo-400 rounded-full inline-block shrink-0" />
                      <span>{children}</span>
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 mt-3 mb-1 flex items-center gap-1.5">
                      <span className="w-1 h-3 bg-indigo-400 rounded-full inline-block shrink-0" />
                      <span>{children}</span>
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-xs font-semibold text-foreground mt-2 mb-1">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside pl-4 space-y-1 mb-2.5 text-xs text-muted-foreground marker:text-indigo-500">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside pl-4 space-y-1 mb-2.5 text-xs text-muted-foreground marker:text-indigo-600 dark:marker:text-indigo-400 font-medium">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed pl-1">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 pl-3 py-1.5 my-2.5 rounded-r-lg text-muted-foreground italic text-xs">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 rounded-xl border border-card-border">
                      <table className="min-w-full divide-y divide-card-border text-xs text-left">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted text-foreground font-semibold text-[11px] uppercase tracking-wider">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 border-b border-card-border font-bold">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 border-b border-card-border text-muted-foreground">
                      {children}
                    </td>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-foreground">
                      {children}
                    </strong>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isInline = !match && !String(children).includes("\n");
                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 rounded-md font-mono text-[11px] bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 font-semibold"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }
                    const language = match ? match[1] : "code";
                    return (
                      <CodeSnippetBlock
                        language={language}
                        code={String(children).replace(/\n$/, "")}
                      />
                    );
                  },
                }}
              >
                {suggestion}
              </ReactMarkdown>

              {/* Footer note */}
              <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-muted-foreground" />
                  Generated by local Ollama ({model}) • Review suggestions prior to applying code changes.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-5 text-center text-muted-foreground">
              <p className="text-xs">No AI suggestions generated yet for this test execution.</p>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="mt-2 text-xs font-semibold text-[#5850ec] dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate AI recommendations with Ollama →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
