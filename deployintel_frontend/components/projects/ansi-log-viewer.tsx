"use client";

import React, { useMemo } from "react";
import { ExternalLink } from "lucide-react";

// Standard 16 ANSI color palette tailored for dark terminal backgrounds
const ANSI_COLORS: Record<number, string> = {
  30: "#64748b", // Black / Dark Slate
  31: "#f87171", // Red
  32: "#4ade80", // Green (Vite bright green)
  33: "#facc15", // Yellow (Vite warning yellow)
  34: "#60a5fa", // Blue
  35: "#c084fc", // Magenta / Purple
  36: "#38bdf8", // Cyan (Vite URLs & paths)
  37: "#f1f5f9", // White
  90: "#94a3b8", // Bright Black / Slate
  91: "#fca5a5", // Bright Red
  92: "#86efac", // Bright Green
  93: "#fef08a", // Bright Yellow
  94: "#93c5fd", // Bright Blue
  95: "#f5d0fe", // Bright Magenta
  96: "#a5f3fc", // Bright Cyan
  97: "#ffffff", // Bright White
};

const ANSI_BG_COLORS: Record<number, string> = {
  40: "#1e293b",
  41: "#7f1d1d",
  42: "#14532d",
  43: "#713f12",
  44: "#1e3a8a",
  45: "#581c87",
  46: "#164e63",
  47: "#e2e8f0",
  100: "#334155",
  101: "#991b1b",
  102: "#166534",
  103: "#854d0e",
  104: "#1d4ed8",
  105: "#6b21a8",
  106: "#0e7490",
  107: "#ffffff",
};

function get256Color(code: number): string {
  if (code >= 0 && code <= 7) return ANSI_COLORS[30 + code] || "#f1f5f9";
  if (code >= 8 && code <= 15) return ANSI_COLORS[90 + (code - 8)] || "#ffffff";
  if (code >= 16 && code <= 231) {
    const c = code - 16;
    const r = Math.floor(c / 36) * 51;
    const g = (Math.floor(c / 6) % 6) * 51;
    const b = (c % 6) * 51;
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (code >= 232 && code <= 255) {
    const gray = 8 + (code - 232) * 10;
    return `rgb(${gray}, ${gray}, ${gray})`;
  }
  return "#f1f5f9";
}

export interface AnsiSpan {
  text: string;
  charStart: number;
  charEnd: number;
  color?: string;
  background?: string;
  bold: boolean;
  dim: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
}

export interface ParsedLine {
  plainText: string;
  spans: AnsiSpan[];
  urls: Array<{ url: string; start: number; end: number }>;
}

/**
 * Parses a single line with ANSI escape sequences, box glyphs, or control codes
 * and returns styled spans with URL detection.
 */
export function parseAnsiLine(rawLine: string): ParsedLine {
  // Strip non-color CSI escapes (cursor moves, line clears, screen erase)
  // and OSC sequences, plus Docker multiplex stream header nulls/control chars
  const cleanLine = rawLine
    .replace(
      /(?:\x1b|\u001b|\u009b|[\uFFFD\u25A1\u25AF\u25FB\u25FC\u25FD\u25FE\u3013]|\[\])\[[0-9;?]*[A-HJKSTfhilnsu]/g,
      ""
    )
    .replace(/(?:\x1b|\u001b|\u009b)\](?:[^\x07\x1b]*)(?:\x07|\x1b\\)/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1A\x1C-\x1F]/g, "");

  // Match ANSI color / graphic rendition escape sequences
  // Supports standard \x1b[, \u001b[, \u009b[, unicode replacement/box glyphs, and literal [][
  const ansiRegex =
    /(?:\x1b|\u001b|\u009b|[\uFFFD\u25A1\u25AF\u25FB\u25FC\u25FD\u25FE\u3013]|\[\])\[([0-9;?]*)m/g;

  let color: string | undefined = undefined;
  let background: string | undefined = undefined;
  let bold = false;
  let dim = false;
  let italic = false;
  let underline = false;
  let strikethrough = false;

  const spans: AnsiSpan[] = [];
  let lastIndex = 0;
  let plainText = "";
  let match: RegExpExecArray | null;

  while ((match = ansiRegex.exec(cleanLine)) !== null) {
    const textBefore = cleanLine.substring(lastIndex, match.index);
    if (textBefore.length > 0) {
      const charStart = plainText.length;
      plainText += textBefore;
      spans.push({
        text: textBefore,
        charStart,
        charEnd: plainText.length,
        color,
        background,
        bold,
        dim,
        italic,
        underline,
        strikethrough,
      });
    }

    const codesStr = match[1];
    const codes = codesStr
      ? codesStr.split(";").map((c) => parseInt(c, 10))
      : [0];

    let i = 0;
    while (i < codes.length) {
      const c = codes[i];
      if (isNaN(c) || c === 0) {
        color = undefined;
        background = undefined;
        bold = false;
        dim = false;
        italic = false;
        underline = false;
        strikethrough = false;
      } else if (c === 1) {
        bold = true;
      } else if (c === 2) {
        dim = true;
      } else if (c === 3) {
        italic = true;
      } else if (c === 4) {
        underline = true;
      } else if (c === 9) {
        strikethrough = true;
      } else if (c === 22) {
        bold = false;
        dim = false;
      } else if (c === 23) {
        italic = false;
      } else if (c === 24) {
        underline = false;
      } else if (c === 29) {
        strikethrough = false;
      } else if (c >= 30 && c <= 37) {
        color = ANSI_COLORS[c];
      } else if (c === 38) {
        const mode = codes[i + 1];
        if (mode === 5 && i + 2 < codes.length) {
          color = get256Color(codes[i + 2]);
          i += 2;
        } else if (mode === 2 && i + 4 < codes.length) {
          color = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`;
          i += 4;
        }
      } else if (c === 39) {
        color = undefined;
      } else if (c >= 40 && c <= 47) {
        background = ANSI_BG_COLORS[c];
      } else if (c === 48) {
        const mode = codes[i + 1];
        if (mode === 5 && i + 2 < codes.length) {
          background = get256Color(codes[i + 2]);
          i += 2;
        } else if (mode === 2 && i + 4 < codes.length) {
          background = `rgb(${codes[i + 2]}, ${codes[i + 3]}, ${codes[i + 4]})`;
          i += 4;
        }
      } else if (c === 49) {
        background = undefined;
      } else if (c >= 90 && c <= 97) {
        color = ANSI_COLORS[c];
      } else if (c >= 100 && c <= 107) {
        background = ANSI_BG_COLORS[c];
      }
      i++;
    }

    lastIndex = ansiRegex.lastIndex;
  }

  const remaining = cleanLine.substring(lastIndex);
  if (remaining.length > 0) {
    const charStart = plainText.length;
    plainText += remaining;
    spans.push({
      text: remaining,
      charStart,
      charEnd: plainText.length,
      color,
      background,
      bold,
      dim,
      italic,
      underline,
      strikethrough,
    });
  }

  // Detect URLs in plainText
  const urlRegex = /(https?:\/\/[^\s"'`<>]+)/g;
  const urls: Array<{ url: string; start: number; end: number }> = [];
  let uMatch: RegExpExecArray | null;
  while ((uMatch = urlRegex.exec(plainText)) !== null) {
    let fullUrl = uMatch[1];
    while (/[.,;:!?)\]}>]$/.test(fullUrl)) {
      fullUrl = fullUrl.slice(0, -1);
    }
    const start = uMatch.index;
    const end = start + fullUrl.length;
    urls.push({ url: fullUrl, start, end });
  }

  return { plainText, spans, urls };
}

/**
 * Renders a single parsed log line with ANSI colors and interactive URLs.
 */
function LineRenderer({
  line,
  searchQuery,
}: {
  line: ParsedLine;
  searchQuery?: string;
}) {
  if (line.spans.length === 0) {
    return <div className="min-h-[1.4em]">&nbsp;</div>;
  }

  return (
    <div className="min-h-[1.4em] leading-relaxed break-words whitespace-pre-wrap">
      {line.spans.map((span, sIdx) => {
        // Check if span overlaps with any URL
        const matchingUrl = line.urls.find(
          (u) => span.charStart < u.end && span.charEnd > u.start
        );

        const styleObj: React.CSSProperties = {
          color: span.color || undefined,
          backgroundColor: span.background || undefined,
          fontWeight: span.bold ? 700 : undefined,
          opacity: span.dim ? 0.65 : undefined,
          fontStyle: span.italic ? "italic" : undefined,
          textDecoration: span.strikethrough
            ? "line-through"
            : span.underline
            ? "underline"
            : undefined,
        };

        if (!matchingUrl) {
          // Regular text span (possibly with search query highlighting)
          if (
            searchQuery &&
            searchQuery.trim() &&
            span.text.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            const parts = span.text.split(
              new RegExp(`(${escapeRegExp(searchQuery)})`, "gi")
            );
            return (
              <span key={sIdx} style={styleObj}>
                {parts.map((p, pIdx) =>
                  p.toLowerCase() === searchQuery.toLowerCase() ? (
                    <mark
                      key={pIdx}
                      className="bg-amber-400/30 text-amber-200 px-0.5 rounded-xs"
                    >
                      {p}
                    </mark>
                  ) : (
                    p
                  )
                )}
              </span>
            );
          }
          return (
            <span key={sIdx} style={styleObj}>
              {span.text}
            </span>
          );
        }

        // Span overlaps with a URL
        const isUrlEnd = span.charEnd >= matchingUrl.end;

        return (
          <a
            key={sIdx}
            href={matchingUrl.url}
            target="_blank"
            rel="noopener noreferrer"
            style={styleObj}
            className="hover:underline text-sky-400 hover:text-sky-300 inline-flex items-center gap-0.5 transition-colors cursor-pointer"
            onClick={(e) => e.stopPropagation()}
            title={`Open ${matchingUrl.url} in new tab`}
          >
            <span>{span.text}</span>
            {isUrlEnd && (
              <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />
            )}
          </a>
        );
      })}
    </div>
  );
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface AnsiLogViewerProps {
  logs: string;
  searchQuery?: string;
  showLineNumbers?: boolean;
}

export function AnsiLogViewer({
  logs,
  searchQuery = "",
  showLineNumbers = false,
}: AnsiLogViewerProps) {
  const parsedLines = useMemo(() => {
    if (!logs) return [];
    // Normalize newlines
    const rawLines = logs.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    return rawLines.map(parseAnsiLine);
  }, [logs]);

  if (parsedLines.length === 0) {
    return (
      <div className="text-zinc-500 italic py-4">No output stream recorded.</div>
    );
  }

  return (
    <div className="font-mono text-[12px] text-zinc-300 select-text">
      {parsedLines.map((line, idx) => (
        <div key={idx} className="flex items-start hover:bg-white/[0.02] group">
          {showLineNumbers && (
            <span className="w-10 select-none text-right pr-4 text-zinc-600 text-[11px] shrink-0 font-mono group-hover:text-zinc-400 pt-[1px]">
              {idx + 1}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <LineRenderer line={line} searchQuery={searchQuery} />
          </div>
        </div>
      ))}
    </div>
  );
}
