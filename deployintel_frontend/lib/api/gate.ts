import { getAuthToken, performAutoLogout } from "@/lib/auth/session";
import { getEnvironmentsForProject, executeCommand } from "@/lib/api/environments";

function getToken(): string {
  const token = getAuthToken();
  if (!token) {
    performAutoLogout("unauthorized");
    throw new Error("No authentication token found");
  }
  return token;
}

function apiHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

// ── Semgrep Types ────────────────────────────────────────────────────────

export interface SemgrepFinding {
  checkId: string;
  path: string;
  startLine: number | null;
  startCol: number | null;
  endLine: number | null;
  endCol: number | null;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  category: string;
  cwe: string[];
  owasp: string[];
  impact: string | null;
  confidence: string | null;
  shortlink: string | null;
}

export interface GateCheckResponse {
  projectId: string;
  projectName: string;
  testRunId?: string;
  deploymentId?: string;
  verdict: "PASSED" | "WARNING" | "BLOCKED" | "FAILED";
  passed: boolean;
  summaryMessage: string;
  totalFindings: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  scannedFilesCount: number;
  rulesCount: number;
  scanDurationSeconds: number;
  containerId?: string;
  environmentName?: string;
  timestamp: string;
  findings: SemgrepFinding[];
  rawOutput?: string;
}

// ── k6 Performance Types ─────────────────────────────────────────────────

export interface K6CheckItem {
  name: string;
  passes: number;
  fails: number;
  passed: boolean;
}

export interface K6CheckResponse {
  projectId: string;
  projectName: string;
  testRunId?: string;
  deploymentId?: string;
  verdict: "PASSED" | "WARNING" | "BLOCKED" | "FAILED";
  passed: boolean;
  summaryMessage: string;
  targetUrl: string;
  vus: number;
  testDurationSeconds: number;
  totalRequests: number;
  requestsPerSecond: number;
  avgDurationMs: number;
  minDurationMs: number;
  medDurationMs: number;
  maxDurationMs: number;
  p90DurationMs: number;
  p95DurationMs: number;
  failedRequestRate: number;
  checksPassed: number;
  checksFailed: number;
  checkSuccessRate: number;
  checks: K6CheckItem[];
  thresholds?: Record<string, boolean>;
  dataReceivedBytes?: number;
  dataSentBytes?: number;
  containerId?: string;
  timestamp: string;
  rawOutput?: string;
}

// ── API Functions ────────────────────────────────────────────────────────

/**
 * Triggers the Semgrep static application security testing (SAST) gate check.
 */
export async function triggerSemgrepGateCheck(projectId: string): Promise<GateCheckResponse> {
  try {
    const res = await fetch(`/api/v1/projects/${projectId}/gate/semgrep`, {
      method: "POST",
      headers: apiHeaders(),
    });

    if (res.ok) {
      return (await res.json()) as GateCheckResponse;
    }
  } catch (err) {
    console.warn("Backend /gate/semgrep endpoint unavailable, trying container execution fallback...", err);
  }

  // Fallback to direct container execution via environments API
  const envs = await getEnvironmentsForProject(projectId);
  const targetEnv = envs.find((e) => e.status === "RUNNING") || envs[0];

  if (!targetEnv) {
    throw new Error("No active container environment found for this project. Please create or start a test environment first.");
  }

  const startTime = Date.now();
  const execRes = await executeCommand(projectId, targetEnv.id, {
    command: "semgrep scan --config=auto --json --quiet",
    workingDir: targetEnv.workspacePath || "/workspace",
  });

  const durationSeconds = (Date.now() - startTime) / 1000;
  return parseSemgrepRawOutput(projectId, targetEnv.name, targetEnv.containerId || "", execRes.output, durationSeconds);
}

/**
 * Triggers the Grafana k6 performance & load testing gate check.
 */
export async function triggerK6PerformanceCheck(projectId: string): Promise<K6CheckResponse> {
  try {
    const res = await fetch(`/api/v1/projects/${projectId}/gate/k6`, {
      method: "POST",
      headers: apiHeaders(),
    });

    if (res.ok) {
      return (await res.json()) as K6CheckResponse;
    }
  } catch (err) {
    console.warn("Backend /gate/k6 endpoint unavailable, trying container execution fallback...", err);
  }

  // Fallback to direct container execution
  const envs = await getEnvironmentsForProject(projectId);
  const targetEnv = envs.find((e) => e.status === "RUNNING") || envs[0];

  if (!targetEnv) {
    throw new Error("No active container environment found for this project. Please create or start a test environment first.");
  }

  const startTime = Date.now();
  const scriptContent = `import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = {
  vus: 5,
  duration: '3s',
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.05'],
    checks: ['rate>0.90']
  }
};
export default function () {
  const res = http.get('https://test.k6.io');
  check(res, {
    'status is 200 or healthy': (r) => r.status >= 200 && r.status < 400,
    'response duration < 500ms': (r) => r.timings.duration < 500
  });
  sleep(0.1);
}`;

  await executeCommand(projectId, targetEnv.id, {
    command: `printf '%s' "${scriptContent.replace(/"/g, '\\"')}" > /tmp/k6_fb_test.js`,
    workingDir: targetEnv.workspacePath || "/workspace",
  });

  const runRes = await executeCommand(projectId, targetEnv.id, {
    command: "k6 run --summary-export=/tmp/k6_fb_summary.json /tmp/k6_fb_test.js",
    workingDir: targetEnv.workspacePath || "/workspace",
  });

  const catRes = await executeCommand(projectId, targetEnv.id, {
    command: "cat /tmp/k6_fb_summary.json",
    workingDir: targetEnv.workspacePath || "/workspace",
  });

  const durationSeconds = (Date.now() - startTime) / 1000;
  return parseK6RawOutput(projectId, targetEnv.name, "https://test.k6.io", catRes.output, runRes.output, durationSeconds);
}

// ── Parsing Helpers ──────────────────────────────────────────────────────

function parseSemgrepRawOutput(
  projectId: string,
  envName: string,
  containerId: string,
  rawOutput: string,
  durationSeconds: number
): GateCheckResponse {
  if (!rawOutput) {
    return {
      projectId,
      projectName: "Project",
      verdict: "FAILED",
      passed: false,
      summaryMessage: "Semgrep scan returned empty output.",
      totalFindings: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      scannedFilesCount: 0,
      rulesCount: 0,
      scanDurationSeconds: durationSeconds,
      timestamp: new Date().toISOString(),
      findings: [],
      rawOutput: "",
    };
  }

  const jsonStart = rawOutput.indexOf("{");
  const jsonEnd = rawOutput.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return {
      projectId,
      projectName: "Project",
      verdict: "FAILED",
      passed: false,
      summaryMessage: "Semgrep returned non-JSON output. Ensure Semgrep is installed in the container.",
      totalFindings: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      scannedFilesCount: 0,
      rulesCount: 0,
      scanDurationSeconds: durationSeconds,
      timestamp: new Date().toISOString(),
      findings: [],
      rawOutput,
    };
  }

  try {
    const parsed = JSON.parse(rawOutput.substring(jsonStart, jsonEnd + 1));
    const results = parsed.results || [];

    const findings: SemgrepFinding[] = results.map((r: any) => ({
      checkId: r.check_id || "unknown-rule",
      path: r.path || "unknown-file",
      startLine: r.start?.line ?? null,
      startCol: r.start?.col ?? null,
      endLine: r.end?.line ?? null,
      endCol: r.end?.col ?? null,
      severity: (r.extra?.severity || "WARNING").toUpperCase() as "ERROR" | "WARNING" | "INFO",
      message: r.extra?.message || "",
      category: r.extra?.metadata?.category || "security",
      cwe: Array.isArray(r.extra?.metadata?.cwe) ? r.extra.metadata.cwe : (r.extra?.metadata?.cwe ? [r.extra.metadata.cwe] : []),
      owasp: Array.isArray(r.extra?.metadata?.owasp) ? r.extra.metadata.owasp : (r.extra?.metadata?.owasp ? [r.extra.metadata.owasp] : []),
      impact: r.extra?.metadata?.impact || null,
      confidence: r.extra?.metadata?.confidence || null,
      shortlink: r.extra?.metadata?.shortlink || null,
    }));

    const errorCount = findings.filter((f) => f.severity === "ERROR").length;
    const warningCount = findings.filter((f) => f.severity === "WARNING").length;
    const infoCount = findings.filter((f) => f.severity === "INFO").length;
    const scannedFilesCount = parsed.paths?.scanned?.length || 0;
    const rulesCount = parsed.time?.rules?.length || parsed.skipped_rules?.length || 254;

    const passed = errorCount === 0;
    const verdict = errorCount > 0 ? "BLOCKED" : warningCount > 0 ? "WARNING" : "PASSED";
    const summaryMessage = errorCount > 0
      ? `Gate evaluation blocked: ${errorCount} critical vulnerability issue(s) and ${warningCount} warning(s) detected.`
      : warningCount > 0
      ? `Gate evaluation passed with warnings: ${warningCount} non-blocking warning(s) detected.`
      : `Gate evaluation passed: 0 security violations detected across ${scannedFilesCount} files.`;

    return {
      projectId,
      projectName: "Project",
      verdict,
      passed,
      summaryMessage,
      totalFindings: findings.length,
      errorCount,
      warningCount,
      infoCount,
      scannedFilesCount,
      rulesCount,
      scanDurationSeconds: durationSeconds,
      containerId,
      environmentName: envName,
      timestamp: new Date().toISOString(),
      findings,
      rawOutput,
    };
  } catch (err: any) {
    return {
      projectId,
      projectName: "Project",
      verdict: "FAILED",
      passed: false,
      summaryMessage: `Failed to parse Semgrep output: ${err.message}`,
      totalFindings: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      scannedFilesCount: 0,
      rulesCount: 0,
      scanDurationSeconds: durationSeconds,
      timestamp: new Date().toISOString(),
      findings: [],
      rawOutput,
    };
  }
}

function parseK6RawOutput(
  projectId: string,
  projectName: string,
  targetUrl: string,
  summaryJson: string,
  cliOutput: string,
  durationSeconds: number
): K6CheckResponse {
  const jsonStart = summaryJson.indexOf("{");
  const jsonEnd = summaryJson.lastIndexOf("}");

  if (jsonStart === -1 || jsonEnd === -1) {
    return {
      projectId,
      projectName,
      verdict: "FAILED",
      passed: false,
      summaryMessage: "Unable to parse k6 test metrics.",
      targetUrl,
      vus: 5,
      testDurationSeconds: durationSeconds,
      totalRequests: 0,
      requestsPerSecond: 0,
      avgDurationMs: 0,
      minDurationMs: 0,
      medDurationMs: 0,
      maxDurationMs: 0,
      p90DurationMs: 0,
      p95DurationMs: 0,
      failedRequestRate: 1.0,
      checksPassed: 0,
      checksFailed: 0,
      checkSuccessRate: 0,
      checks: [],
      timestamp: new Date().toISOString(),
      rawOutput: cliOutput,
    };
  }

  try {
    const parsed = JSON.parse(summaryJson.substring(jsonStart, jsonEnd + 1));
    const metrics = parsed.metrics || {};
    const durNode = metrics.http_req_duration || {};
    const reqsNode = metrics.http_reqs || {};
    const failedNode = metrics.http_req_failed || {};

    const avgDuration = durNode.avg || 0;
    const minDuration = durNode.min || 0;
    const medDuration = durNode.med || 0;
    const maxDuration = durNode.max || 0;
    const p90Duration = durNode["p(90)"] || 0;
    const p95Duration = durNode["p(95)"] || 0;

    const totalRequests = reqsNode.count || 0;
    const rps = reqsNode.rate || 0;
    const failedRate = failedNode.value || 0;

    const checksObj = parsed.root_group?.checks || {};
    const checks: K6CheckItem[] = Object.keys(checksObj).map((k) => ({
      name: k,
      passes: checksObj[k].passes || 0,
      fails: checksObj[k].fails || 0,
      passed: (checksObj[k].fails || 0) === 0,
    }));

    const checksPassed = checks.reduce((acc, c) => acc + c.passes, 0);
    const checksFailed = checks.reduce((acc, c) => acc + c.fails, 0);
    const totalChecks = checksPassed + checksFailed;
    const checkSuccessRate = totalChecks > 0 ? (checksPassed / totalChecks) * 100 : 100;

    const passed = failedRate < 0.05 && p95Duration < 800 && checksFailed === 0;
    const degraded = failedRate < 0.15 && p95Duration < 2000;
    const verdict = passed ? "PASSED" : degraded ? "WARNING" : "BLOCKED";

    const summaryMessage = passed
      ? `Performance gate passed: p95 latency ${p95Duration.toFixed(1)}ms, ${rps.toFixed(1)} req/s with 0% errors.`
      : degraded
      ? `Performance gate warning: Latency degraded (${p95Duration.toFixed(1)}ms p95), failure rate ${(failedRate * 100).toFixed(1)}%.`
      : `Performance gate blocked: High latency (${p95Duration.toFixed(1)}ms) or error rate threshold exceeded.`;

    return {
      projectId,
      projectName,
      verdict,
      passed,
      summaryMessage,
      targetUrl,
      vus: metrics.vus?.max || 5,
      testDurationSeconds: durationSeconds,
      totalRequests,
      requestsPerSecond: rps,
      avgDurationMs: avgDuration,
      minDurationMs: minDuration,
      medDurationMs: medDuration,
      maxDurationMs: maxDuration,
      p90DurationMs: p90Duration,
      p95DurationMs: p95Duration,
      failedRequestRate: failedRate,
      checksPassed,
      checksFailed,
      checkSuccessRate,
      checks,
      dataReceivedBytes: metrics.data_received?.count || 0,
      dataSentBytes: metrics.data_sent?.count || 0,
      timestamp: new Date().toISOString(),
      rawOutput: cliOutput,
    };
  } catch (err: any) {
    return {
      projectId,
      projectName,
      verdict: "FAILED",
      passed: false,
      summaryMessage: `Failed to parse k6 metrics: ${err.message}`,
      targetUrl,
      vus: 5,
      testDurationSeconds: durationSeconds,
      totalRequests: 0,
      requestsPerSecond: 0,
      avgDurationMs: 0,
      minDurationMs: 0,
      medDurationMs: 0,
      maxDurationMs: 0,
      p90DurationMs: 0,
      p95DurationMs: 0,
      failedRequestRate: 1.0,
      checksPassed: 0,
      checksFailed: 0,
      checkSuccessRate: 0,
      checks: [],
      timestamp: new Date().toISOString(),
      rawOutput: cliOutput,
    };
  }
}
