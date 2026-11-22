package com.example.deployintel.ai.service;

import com.example.deployintel.ai.config.OllamaProperties;
import com.example.deployintel.ai.dto.OllamaGenerateRequest;
import com.example.deployintel.ai.dto.OllamaGenerateResponse;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckItem;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.dto.SemgrepFinding;
import com.example.deployintel.gate.entity.TestRun;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.release.entity.Release;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class OllamaService {

    private final OllamaProperties properties;
    private final ObjectMapper objectMapper;

    private RestClient createRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(properties.getConnectTimeoutMs()));
        factory.setReadTimeout(Duration.ofMillis(properties.getReadTimeoutMs()));

        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .requestFactory(factory)
                .build();
    }

    /**
     * Checks if the local Ollama instance is accessible.
     */
    public boolean isAvailable() {
        if (!properties.isEnabled()) {
            return false;
        }
        try {
            RestClient client = createRestClient();
            String response = client.get()
                    .uri("/api/tags")
                    .accept(MediaType.APPLICATION_JSON, MediaType.ALL)
                    .retrieve()
                    .body(String.class);
            return response != null && response.contains("models");
        } catch (Exception e) {
            log.debug("Ollama is not reachable at {}: {}", properties.getBaseUrl(), e.getMessage());
            return false;
        }
    }

    /**
     * Sends a prompt to local Ollama model and returns the generated text.
     */
    public String generateText(String systemPrompt, String userPrompt) {
        if (!properties.isEnabled()) {
            log.info("Ollama is disabled in configuration. Skipping AI suggestions.");
            return null;
        }

        try {
            RestClient client = createRestClient();
            OllamaGenerateRequest request = OllamaGenerateRequest.builder()
                    .model(properties.getModel())
                    .system(systemPrompt)
                    .prompt(userPrompt)
                    .stream(false)
                    .options(Map.of("temperature", 0.2))
                    .build();

            log.info("Sending test report to Ollama model '{}' at {}...", properties.getModel(), properties.getBaseUrl());
            long start = System.currentTimeMillis();

            // Read raw body as String first to tolerate application/octet-stream or application/json
            String rawJson = client.post()
                    .uri("/api/generate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON, MediaType.ALL)
                    .body(request)
                    .retrieve()
                    .body(String.class);

            long duration = System.currentTimeMillis() - start;
            if (rawJson != null && !rawJson.isBlank()) {
                try {
                    OllamaGenerateResponse response = objectMapper.readValue(rawJson, OllamaGenerateResponse.class);
                    if (response != null && response.getResponse() != null) {
                        log.info("Received AI suggestions from Ollama in {}ms (model: {})", duration, response.getModel());
                        return response.getResponse().trim();
                    }
                } catch (Exception parseEx) {
                    // Fallback for multi-line NDJSON format
                    StringBuilder collected = new StringBuilder();
                    for (String line : rawJson.split("\\r?\\n")) {
                        if (!line.isBlank()) {
                            try {
                                JsonNode node = objectMapper.readTree(line);
                                if (node.has("response")) {
                                    collected.append(node.get("response").asText());
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                    if (collected.length() > 0) {
                        log.info("Received stream-aggregated AI suggestions from Ollama in {}ms", duration);
                        return collected.toString().trim();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to generate AI suggestions from local Ollama: {}", e.getMessage());
        }

        return null;
    }

    /**
     * Analyzes Semgrep SAST test report and produces actionable remediation advice.
     */
    public String analyzeSecurityReport(Project project, GateCheckResponse report) {
        if (report == null) return null;

        String systemPrompt = "You are an elite DevSecOps security engineer in the DeployIntel platform. " +
                "Your role is to analyze automated SAST security scan results and provide clear, actionable, " +
                "and production-grade remediation advice with code examples.";

        StringBuilder sb = new StringBuilder();
        sb.append("### Project & Security Scan Context\n");
        sb.append("- **Project Name**: ").append(project != null ? project.getName() : "Unknown").append("\n");
        sb.append("- **Language**: ").append(project != null && project.getLanguage() != null ? project.getLanguage() : "Multi-language").append("\n");
        sb.append("- **Verdict**: ").append(report.getVerdict()).append("\n");
        sb.append("- **Total Findings**: ").append(report.getTotalFindings()).append(" (Errors: ")
                .append(report.getErrorCount()).append(", Warnings: ").append(report.getWarningCount())
                .append(", Info: ").append(report.getInfoCount()).append(")\n");
        sb.append("- **Scan Duration**: ").append(String.format("%.2fs", report.getScanDurationSeconds())).append("\n\n");

        List<SemgrepFinding> findings = report.getFindings() != null ? report.getFindings() : Collections.emptyList();
        if (findings.isEmpty()) {
            sb.append("All SAST security rules passed. No vulnerabilities were detected.\n");
            sb.append("Please provide a concise confirmation statement and 2-3 forward-looking DevSecOps recommendations to sustain this security posture.");
        } else {
            sb.append("### Detected Vulnerabilities & Findings:\n");
            int count = 1;
            for (SemgrepFinding f : findings) {
                sb.append(count++).append(". **[").append(f.getSeverity()).append("] ").append(f.getCheckId()).append("**\n");
                sb.append("   - **File**: `").append(f.getPath()).append(":").append(f.getStartLine()).append("`\n");
                sb.append("   - **Message**: ").append(f.getMessage()).append("\n");
                if (f.getShortlink() != null && !f.getShortlink().isBlank()) {
                    sb.append("   - **Reference**: ").append(f.getShortlink()).append("\n");
                }
            }
            sb.append("\n### Instructions for Response:\n");
            sb.append("1. **Executive Risk Summary**: Explain the real-world attack risk of the findings.\n");
            sb.append("2. **Step-by-Step Code Remediation**: For the findings above, provide the recommended code fix or secure code snippet.\n");
            sb.append("3. **Security Best Practice**: One preventative measure for CI/CD pipeline.\n");
            sb.append("Keep the response structured in GitHub Flavored Markdown, clean, and concise.");
        }

        return generateText(systemPrompt, sb.toString());
    }

    /**
     * Analyzes k6 performance test report and produces actionable tuning recommendations.
     */
    public String analyzePerformanceReport(Project project, K6CheckResponse report) {
        if (report == null) return null;

        String systemPrompt = "You are a Principal Site Reliability Engineer (SRE) and Performance Tuning specialist in DeployIntel. " +
                "Analyze the provided k6 benchmark telemetry and recommend architectural, code, or configuration optimizations.";

        StringBuilder sb = new StringBuilder();
        sb.append("### Project & Benchmark Telemetry\n");
        sb.append("- **Project Name**: ").append(project != null ? project.getName() : "Unknown").append("\n");
        sb.append("- **Target Endpoint**: `").append(report.getTargetUrl() != null ? report.getTargetUrl() : "Internal").append("`\n");
        sb.append("- **Verdict**: ").append(report.getVerdict()).append("\n");
        sb.append("- **Virtual Users (VUs)**: ").append(report.getVus()).append("\n");
        sb.append("- **Test Duration**: ").append(String.format("%.1fs", report.getTestDurationSeconds())).append("\n");
        sb.append("- **Total Requests**: ").append(report.getTotalRequests()).append(" (Throughput: ")
                .append(String.format("%.1f req/s", report.getRequestsPerSecond())).append(")\n");
        sb.append("- **Latency Profile**:\n");
        sb.append("  - p95 Latency: **").append(String.format("%.1fms", report.getP95DurationMs())).append("** (Target < 800ms)\n");
        sb.append("  - Avg Latency: ").append(String.format("%.1fms", report.getAvgDurationMs())).append("\n");
        sb.append("  - Median Latency: ").append(String.format("%.1fms", report.getMedDurationMs())).append("\n");
        sb.append("  - Max Latency: ").append(String.format("%.1fms", report.getMaxDurationMs())).append("\n");
        sb.append("- **Error / Failed Request Rate**: **")
                .append(String.format("%.2f%%", report.getFailedRequestRate() * 100.0)).append("** (Target < 5%)\n");

        if (report.getChecks() != null && !report.getChecks().isEmpty()) {
            sb.append("- **Assertion Checks**:\n");
            for (K6CheckItem item : report.getChecks()) {
                sb.append("  - ").append(item.isPassed() ? "[PASS] " : "[FAIL] ")
                        .append(item.getName()).append(" (passes: ").append(item.getPasses())
                        .append(", fails: ").append(item.getFails()).append(")\n");
            }
        }

        sb.append("\n### Instructions for Response:\n");
        sb.append("1. **Performance Diagnosis**: Assess whether the service is healthy or suffering from bottlenecking (CPU, connection pooling, slow database query, memory leak).\n");
        sb.append("2. **Targeted Optimizations**: Suggest 2-3 specific technical interventions (e.g., Redis caching, database indexes, HTTP keep-alive, connection pool sizing, asynchronous processing).\n");
        sb.append("3. **Recommended Stress Target**: Suggest what next threshold to test before high-load deployment.\n");
        sb.append("Format with clean Markdown headings and bullet points.");

        return generateText(systemPrompt, sb.toString());
    }

    /**
     * Analyzes combined release gate checks and provides release advisory.
     */
    public String analyzeReleaseReport(
            Project project,
            Release release,
            GateCheckResponse securityReport,
            K6CheckResponse perfReport,
            String compositeVerdict,
            double compositeScore
    ) {
        String systemPrompt = "You are an automated Release Gate Advisor in DeployIntel. " +
                "Evaluate the combined security and performance telemetry for this release and give an actionable go/no-go recommendation.";

        StringBuilder sb = new StringBuilder();
        sb.append("### Release Gate Assessment\n");
        sb.append("- **Project**: ").append(project != null ? project.getName() : "Unknown").append("\n");
        sb.append("- **Release Version**: `").append(release != null ? release.getVersionNumber() : "N/A").append("`\n");
        sb.append("- **Branch / Commit**: `").append(release != null ? release.getBranch() : "").append("` (`")
                .append(release != null && release.getCommitSha() != null ? release.getCommitSha() : "N/A").append("`)\n");
        sb.append("- **Composite Gate Score**: **").append(String.format("%.1f/100", compositeScore))
                .append("** (Verdict: **").append(compositeVerdict).append("**)\n\n");

        if (securityReport != null) {
            sb.append("#### Security (Semgrep):\n");
            sb.append("- Status: ").append(securityReport.getVerdict()).append(", Total Findings: ").append(securityReport.getTotalFindings()).append("\n");
        }
        if (perfReport != null) {
            sb.append("#### Performance (k6):\n");
            sb.append("- Status: ").append(perfReport.getVerdict()).append(", p95: ")
                    .append(String.format("%.1fms", perfReport.getP95DurationMs()))
                    .append(", Error Rate: ").append(String.format("%.2f%%", perfReport.getFailedRequestRate() * 100.0)).append("\n");
        }

        sb.append("\nProvide a concise 3-paragraph executive summary with go/no-go recommendation, priority fixes needed, and risk mitigations.");
        return generateText(systemPrompt, sb.toString());
    }
}
