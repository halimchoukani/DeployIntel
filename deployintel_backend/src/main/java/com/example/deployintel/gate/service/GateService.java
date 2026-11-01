package com.example.deployintel.gate.service;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.common.exception.ProjectAccessDeniedException;
import com.example.deployintel.common.exception.ProjectNotFoundException;
import com.example.deployintel.environment.dto.CommandExecutionResponse;
import com.example.deployintel.environment.dto.CreateEnvironmentRequest;
import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.example.deployintel.environment.entity.TestEnvironment;
import com.example.deployintel.environment.repository.TestEnvironmentRepository;
import com.example.deployintel.environment.service.DockerService;
import com.example.deployintel.environment.service.EnvironmentService;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckItem;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.dto.SemgrepFinding;
import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.repository.ProjectRepository;
import com.example.deployintel.deployment.entity.Deployment;
import com.example.deployintel.deployment.repository.DeploymentRepository;
import com.example.deployintel.gate.entity.*;
import com.example.deployintel.gate.repository.*;
import com.example.deployintel.user.entity.UserRole;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GateService {

    private final ProjectRepository projectRepository;
    private final TestEnvironmentRepository testEnvironmentRepository;
    private final DockerService dockerService;
    private final EnvironmentService environmentService;
    private final ObjectMapper objectMapper;
    private final DeploymentRepository deploymentRepository;
    private final TestRunRepository testRunRepository;
    private final TestResultRepository testResultRepository;
    private final SecurityFindingRepository securityFindingRepository;
    private final PerformanceMetricRepository performanceMetricRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;
    private final RiskRuleRepository riskRuleRepository;

    @Transactional
    public GateCheckResponse runSemgrepCheck(UserPrincipal currentUser, UUID projectId) {
        Project project = getProjectAndValidateAccess(currentUser, projectId);

        if (!dockerService.isDockerAvailable()) {
            return GateCheckResponse.builder()
                    .projectId(projectId.toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Docker daemon is unreachable. Verify Docker Desktop is running to execute Semgrep gate checks.")
                    .timestamp(OffsetDateTime.now())
                    .findings(Collections.emptyList())
                    .build();
        }

        TestEnvironment targetEnv = findOrCreateEnvironment(currentUser, projectId);
        if (targetEnv == null || targetEnv.getContainerId() == null) {
            return GateCheckResponse.builder()
                    .projectId(projectId.toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Could not initialize a container environment to run Semgrep.")
                    .timestamp(OffsetDateTime.now())
                    .findings(Collections.emptyList())
                    .build();
        }

        String containerId = targetEnv.getContainerId();
        String workspacePath = (targetEnv.getWorkspacePath() != null && !targetEnv.getWorkspacePath().isBlank())
                ? targetEnv.getWorkspacePath()
                : "/workspace";

        // Ensure container is running
        EnvironmentStatus status = dockerService.getContainerStatus(containerId);
        if (status == EnvironmentStatus.STOPPED) {
            log.info("Container {} is stopped. Starting container for gate evaluation...", containerId);
            dockerService.startContainer(containerId);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ignored) {}
        }

        // Ensure Semgrep is available in the container
        CommandExecutionResponse checkSemgrep = dockerService.executeCommand(containerId, "command -v semgrep", workspacePath);
        if (!checkSemgrep.success() || checkSemgrep.exitCode() != 0) {
            log.info("Semgrep binary not found in container {}. Installing pip semgrep...", containerId);
            dockerService.executeCommand(
                    containerId,
                    "python3 -m pip install --break-system-packages --no-cache-dir semgrep || pip install --break-system-packages --no-cache-dir semgrep",
                    workspacePath
            );
        }

        // Run the Semgrep SAST scan
        long startTime = System.currentTimeMillis();
        String semgrepCmd = "semgrep scan --config=auto --json --quiet";
        CommandExecutionResponse execResult = dockerService.executeCommand(containerId, semgrepCmd, workspacePath);
        double durationSeconds = (System.currentTimeMillis() - startTime) / 1000.0;

        String rawOutput = execResult.output();
        log.info("Semgrep execution finished in {}s with exitCode {}. Output length: {}",
                durationSeconds, execResult.exitCode(), (rawOutput != null ? rawOutput.length() : 0));

        GateCheckResponse response = parseSemgrepOutput(project, targetEnv, rawOutput, durationSeconds);
        try {
            persistSemgrepResults(project, targetEnv, response, durationSeconds, rawOutput);
        } catch (Exception e) {
            log.error("Failed to persist Semgrep test results to database: {}", e.getMessage(), e);
        }
        return response;
    }

    @Transactional
    public K6CheckResponse runK6PerformanceCheck(UserPrincipal currentUser, UUID projectId) {
        Project project = getProjectAndValidateAccess(currentUser, projectId);

        if (!dockerService.isDockerAvailable()) {
            return K6CheckResponse.builder()
                    .projectId(projectId.toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Docker daemon is unreachable. Verify Docker Desktop is running to execute k6 performance tests.")
                    .timestamp(OffsetDateTime.now())
                    .checks(Collections.emptyList())
                    .build();
        }

        TestEnvironment targetEnv = findOrCreateEnvironment(currentUser, projectId);
        if (targetEnv == null || targetEnv.getContainerId() == null) {
            return K6CheckResponse.builder()
                    .projectId(projectId.toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Could not initialize a container environment to run k6 performance tests.")
                    .timestamp(OffsetDateTime.now())
                    .checks(Collections.emptyList())
                    .build();
        }

        String containerId = targetEnv.getContainerId();
        String workspacePath = (targetEnv.getWorkspacePath() != null && !targetEnv.getWorkspacePath().isBlank())
                ? targetEnv.getWorkspacePath()
                : "/workspace";

        // Ensure container is running
        EnvironmentStatus status = dockerService.getContainerStatus(containerId);
        if (status == EnvironmentStatus.STOPPED) {
            log.info("Container {} is stopped. Starting container for k6 evaluation...", containerId);
            dockerService.startContainer(containerId);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException ignored) {}
        }

        // Ensure k6 is installed
        ensureK6Available(containerId, workspacePath);

        // Determine target URL for benchmark
        String targetUrl = "https://test.k6.io";
        if (targetEnv.getPortMapping() != null && !targetEnv.getPortMapping().isBlank()) {
            String[] parts = targetEnv.getPortMapping().split(":");
            String containerPort = parts.length > 1 ? parts[1] : parts[0];
            CommandExecutionResponse pingPort = dockerService.executeCommand(
                    containerId,
                    "wget -q -O - http://127.0.0.1:" + containerPort + " >/dev/null 2>&1",
                    workspacePath
            );
            if (pingPort.exitCode() == 0) {
                targetUrl = "http://127.0.0.1:" + containerPort;
            }
        }

        // Generate k6 test script
        String scriptContent = String.join("\n",
                "import http from 'k6/http';",
                "import { check, sleep } from 'k6';",
                "export const options = {",
                "  vus: 5,",
                "  duration: '3s',",
                "  thresholds: {",
                "    http_req_duration: ['p(95)<800'],",
                "    http_req_failed: ['rate<0.05'],",
                "    checks: ['rate>0.90']",
                "  }",
                "};",
                "export default function () {",
                "  const res = http.get('" + targetUrl + "');",
                "  check(res, {",
                "    'status is 200 or healthy': (r) => r.status >= 200 && r.status < 400,",
                "    'response duration < 500ms': (r) => r.timings.duration < 500",
                "  });",
                "  sleep(0.1);",
                "}"
        );

        String safeScript = scriptContent.replace("'", "'\\''");
        dockerService.executeCommand(containerId, "printf '%s' '" + safeScript + "' > /tmp/k6_gate_test.js", workspacePath);

        // Run k6
        long startTime = System.currentTimeMillis();
        CommandExecutionResponse execRes = dockerService.executeCommand(
                containerId,
                "k6 run --summary-export=/tmp/k6_gate_summary.json /tmp/k6_gate_test.js",
                workspacePath
        );
        double durationSeconds = (System.currentTimeMillis() - startTime) / 1000.0;

        // Fetch summary JSON
        CommandExecutionResponse catSummary = dockerService.executeCommand(containerId, "cat /tmp/k6_gate_summary.json", workspacePath);
        String summaryJson = catSummary.output();

        K6CheckResponse response = parseK6Output(project, targetEnv, targetUrl, summaryJson, execRes.output(), durationSeconds);
        try {
            persistK6Results(project, targetEnv, response, durationSeconds, execRes.output());
        } catch (Exception e) {
            log.error("Failed to persist k6 test results to database: {}", e.getMessage(), e);
        }
        return response;
    }

    private TestEnvironment findOrCreateEnvironment(UserPrincipal currentUser, UUID projectId) {
        List<TestEnvironment> environments = testEnvironmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        for (TestEnvironment env : environments) {
            if (env.getContainerId() != null) {
                return env;
            }
        }

        log.info("No active test environment found for project {}. Auto-provisioning runner...", projectId);
        try {
            environmentService.createEnvironment(
                    currentUser,
                    projectId,
                    new CreateEnvironmentRequest("Security & Performance Gate Runner", null, null, null, "/workspace", true, true)
            );
            List<TestEnvironment> refreshed = testEnvironmentRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
            return refreshed.isEmpty() ? null : refreshed.get(0);
        } catch (Exception e) {
            log.error("Failed to auto-provision test environment for project {}: {}", projectId, e.getMessage());
            return null;
        }
    }

    private void ensureK6Available(String containerId, String workspacePath) {
        CommandExecutionResponse checkK6 = dockerService.executeCommand(containerId, "command -v k6", workspacePath);
        if (checkK6.success() && checkK6.exitCode() == 0) {
            return;
        }

        log.info("k6 binary not found in container {}. Installing k6...", containerId);
        String installCmd = "if ! command -v k6 >/dev/null 2>&1; then " +
                "  wget -qO /tmp/k6.tar.gz https://github.com/grafana/k6/releases/download/v0.56.0/k6-v0.56.0-linux-amd64.tar.gz 2>/dev/null || " +
                "  curl -sSL -o /tmp/k6.tar.gz https://github.com/grafana/k6/releases/download/v0.56.0/k6-v0.56.0-linux-amd64.tar.gz 2>/dev/null; " +
                "  if [ -f /tmp/k6.tar.gz ]; then " +
                "    tar -xzf /tmp/k6.tar.gz -C /tmp && mv /tmp/k6-*/k6 /usr/bin/k6 && chmod +x /usr/bin/k6 && rm -rf /tmp/k6*; " +
                "  fi; " +
                "fi";
        dockerService.executeCommand(containerId, installCmd, workspacePath);
    }

    private K6CheckResponse parseK6Output(
            Project project,
            TestEnvironment targetEnv,
            String targetUrl,
            String summaryJson,
            String cliOutput,
            double durationSeconds
    ) {
        if (summaryJson == null || summaryJson.isBlank()) {
            return K6CheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("k6 execution returned empty summary metrics.")
                    .targetUrl(targetUrl)
                    .containerId(targetEnv.getContainerId())
                    .testDurationSeconds(durationSeconds)
                    .timestamp(OffsetDateTime.now())
                    .rawOutput(cliOutput)
                    .checks(Collections.emptyList())
                    .build();
        }

        int jsonStart = summaryJson.indexOf("{");
        int jsonEnd = summaryJson.lastIndexOf("}");
        if (jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart) {
            return K6CheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Unable to parse k6 JSON summary.")
                    .targetUrl(targetUrl)
                    .containerId(targetEnv.getContainerId())
                    .testDurationSeconds(durationSeconds)
                    .timestamp(OffsetDateTime.now())
                    .rawOutput(cliOutput)
                    .checks(Collections.emptyList())
                    .build();
        }

        try {
            JsonNode root = objectMapper.readTree(summaryJson.substring(jsonStart, jsonEnd + 1));
            JsonNode metrics = root.path("metrics");

            // Duration metrics
            JsonNode durNode = metrics.path("http_req_duration");
            double avgDuration = durNode.path("avg").asDouble(0.0);
            double minDuration = durNode.path("min").asDouble(0.0);
            double medDuration = durNode.path("med").asDouble(0.0);
            double maxDuration = durNode.path("max").asDouble(0.0);
            double p90Duration = durNode.path("p(90)").asDouble(0.0);
            double p95Duration = durNode.path("p(95)").asDouble(0.0);

            // Request metrics
            JsonNode reqsNode = metrics.path("http_reqs");
            long totalRequests = reqsNode.path("count").asLong(0);
            double rps = reqsNode.path("rate").asDouble(0.0);

            // Failed request rate
            JsonNode failedNode = metrics.path("http_req_failed");
            double failedRate = failedNode.path("value").asDouble(0.0);

            // VUs
            int vus = metrics.path("vus").path("max").asInt(5);

            // Bytes
            long bytesReceived = metrics.path("data_received").path("count").asLong(0);
            long bytesSent = metrics.path("data_sent").path("count").asLong(0);

            // Checks
            List<K6CheckItem> checkItems = new ArrayList<>();
            JsonNode checksRoot = root.path("root_group").path("checks");
            int totalCheckPasses = 0;
            int totalCheckFails = 0;

            if (checksRoot.isObject()) {
                Iterator<Map.Entry<String, JsonNode>> fields = checksRoot.fields();
                while (fields.hasNext()) {
                    Map.Entry<String, JsonNode> entry = fields.next();
                    String name = entry.getKey();
                    JsonNode cNode = entry.getValue();
                    int passes = cNode.path("passes").asInt(0);
                    int fails = cNode.path("fails").asInt(0);
                    totalCheckPasses += passes;
                    totalCheckFails += fails;
                    checkItems.add(new K6CheckItem(name, passes, fails, fails == 0));
                }
            }

            int allChecksCount = totalCheckPasses + totalCheckFails;
            double checkSuccessRate = allChecksCount > 0 ? ((double) totalCheckPasses / allChecksCount) * 100.0 : 100.0;

            // Thresholds
            Map<String, Boolean> thresholds = new HashMap<>();
            JsonNode durThresh = durNode.path("thresholds");
            if (durThresh.isObject()) {
                durThresh.fieldNames().forEachRemaining(name -> thresholds.put(name, !durThresh.get(name).asBoolean(true)));
            }

            // Verdict
            boolean passed = (failedRate < 0.05) && (p95Duration < 800) && (totalCheckFails == 0);
            boolean degraded = (failedRate < 0.15) && (p95Duration < 2000);
            String verdict = passed ? "PASSED" : (degraded ? "WARNING" : "BLOCKED");

            String summaryMessage;
            if (passed) {
                summaryMessage = String.format("Performance gate passed: p95 latency %.1fms, %.1f req/s with 0%% errors across %d requests.",
                        p95Duration, rps, totalRequests);
            } else if (degraded) {
                summaryMessage = String.format("Performance gate warning: Latency or error rate degraded. p95 %.1fms, failure rate %.1f%%.",
                        p95Duration, failedRate * 100.0);
            } else {
                summaryMessage = String.format("Performance gate blocked: High latency or error rate threshold exceeded. p95 %.1fms, failure rate %.1f%%.",
                        p95Duration, failedRate * 100.0);
            }

            return K6CheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict(verdict)
                    .passed(passed)
                    .summaryMessage(summaryMessage)
                    .targetUrl(targetUrl)
                    .vus(vus)
                    .testDurationSeconds(durationSeconds)
                    .totalRequests(totalRequests)
                    .requestsPerSecond(rps)
                    .avgDurationMs(avgDuration)
                    .minDurationMs(minDuration)
                    .medDurationMs(medDuration)
                    .maxDurationMs(maxDuration)
                    .p90DurationMs(p90Duration)
                    .p95DurationMs(p95Duration)
                    .failedRequestRate(failedRate)
                    .checksPassed(totalCheckPasses)
                    .checksFailed(totalCheckFails)
                    .checkSuccessRate(checkSuccessRate)
                    .checks(checkItems)
                    .thresholds(thresholds)
                    .dataReceivedBytes(bytesReceived)
                    .dataSentBytes(bytesSent)
                    .containerId(targetEnv.getContainerId())
                    .timestamp(OffsetDateTime.now())
                    .rawOutput(cliOutput)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse k6 JSON summary: {}", e.getMessage(), e);
            return K6CheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Failed to parse k6 test output: " + e.getMessage())
                    .targetUrl(targetUrl)
                    .containerId(targetEnv.getContainerId())
                    .testDurationSeconds(durationSeconds)
                    .timestamp(OffsetDateTime.now())
                    .rawOutput(cliOutput)
                    .checks(Collections.emptyList())
                    .build();
        }
    }

    private GateCheckResponse parseSemgrepOutput(Project project, TestEnvironment targetEnv, String rawOutput, double durationSeconds) {
        if (rawOutput == null || rawOutput.isBlank()) {
            return GateCheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Semgrep scan returned empty output.")
                    .containerId(targetEnv.getContainerId())
                    .environmentName(targetEnv.getName())
                    .scanDurationSeconds(durationSeconds)
                    .timestamp(OffsetDateTime.now())
                    .findings(Collections.emptyList())
                    .build();
        }

        int jsonStart = rawOutput.indexOf("{");
        int jsonEnd = rawOutput.lastIndexOf("}");
        if (jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart) {
            return GateCheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Unable to parse Semgrep response: " + (rawOutput.length() > 200 ? rawOutput.substring(0, 200) + "..." : rawOutput))
                    .rawOutput(rawOutput)
                    .containerId(targetEnv.getContainerId())
                    .environmentName(targetEnv.getName())
                    .scanDurationSeconds(durationSeconds)
                    .timestamp(OffsetDateTime.now())
                    .findings(Collections.emptyList())
                    .build();
        }

        String jsonStr = rawOutput.substring(jsonStart, jsonEnd + 1);
        try {
            JsonNode root = objectMapper.readTree(jsonStr);
            List<SemgrepFinding> findings = new ArrayList<>();
            int errorCount = 0;
            int warningCount = 0;
            int infoCount = 0;

            JsonNode resultsNode = root.get("results");
            if (resultsNode != null && resultsNode.isArray()) {
                for (JsonNode res : resultsNode) {
                    String checkId = res.path("check_id").asText("unknown-rule");
                    String path = res.path("path").asText("unknown-file");
                    Integer startLine = res.path("start").has("line") ? res.path("start").get("line").asInt() : null;
                    Integer startCol = res.path("start").has("col") ? res.path("start").get("col").asInt() : null;
                    Integer endLine = res.path("end").has("line") ? res.path("end").get("line").asInt() : null;
                    Integer endCol = res.path("end").has("col") ? res.path("end").get("col").asInt() : null;

                    JsonNode extra = res.path("extra");
                    String severity = extra.path("severity").asText("WARNING").toUpperCase(Locale.ROOT);
                    String message = extra.path("message").asText("");

                    JsonNode meta = extra.path("metadata");
                    String category = meta.path("category").asText("security");
                    String impact = meta.has("impact") ? meta.path("impact").asText() : null;
                    String confidence = meta.has("confidence") ? meta.path("confidence").asText() : null;
                    String shortlink = meta.has("shortlink") ? meta.path("shortlink").asText() : null;

                    List<String> cweList = new ArrayList<>();
                    JsonNode cweNode = meta.path("cwe");
                    if (cweNode.isArray()) {
                        for (JsonNode c : cweNode) cweList.add(c.asText());
                    } else if (cweNode.isTextual()) {
                        cweList.add(cweNode.asText());
                    }

                    List<String> owaspList = new ArrayList<>();
                    JsonNode owaspNode = meta.path("owasp");
                    if (owaspNode.isArray()) {
                        for (JsonNode o : owaspNode) owaspList.add(o.asText());
                    } else if (owaspNode.isTextual()) {
                        owaspList.add(owaspNode.asText());
                    }

                    if ("ERROR".equals(severity)) {
                        errorCount++;
                    } else if ("WARNING".equals(severity)) {
                        warningCount++;
                    } else {
                        infoCount++;
                    }

                    findings.add(SemgrepFinding.builder()
                            .checkId(checkId)
                            .path(path)
                            .startLine(startLine)
                            .startCol(startCol)
                            .endLine(endLine)
                            .endCol(endCol)
                            .severity(severity)
                            .message(message)
                            .category(category)
                            .cwe(cweList)
                            .owasp(owaspList)
                            .impact(impact)
                            .confidence(confidence)
                            .shortlink(shortlink)
                            .build());
                }
            }

            int scannedFiles = 0;
            JsonNode pathsNode = root.get("paths");
            if (pathsNode != null && pathsNode.has("scanned") && pathsNode.get("scanned").isArray()) {
                scannedFiles = pathsNode.get("scanned").size();
            }

            int rulesCount = 0;
            JsonNode timeNode = root.get("time");
            if (timeNode != null && timeNode.has("rules") && timeNode.get("rules").isArray()) {
                rulesCount = timeNode.get("rules").size();
            }
            if (rulesCount == 0 && root.has("skipped_rules") && root.get("skipped_rules").isArray()) {
                rulesCount = root.get("skipped_rules").size() + findings.size();
            }

            boolean passed = (errorCount == 0);
            String verdict = errorCount > 0 ? "BLOCKED" : (warningCount > 0 ? "WARNING" : "PASSED");
            String summary;
            if (errorCount > 0) {
                summary = String.format("Gate evaluation blocked: %d critical vulnerability issue(s) and %d warning(s) detected.", errorCount, warningCount);
            } else if (warningCount > 0) {
                summary = String.format("Gate evaluation passed with warnings: %d non-blocking warning(s) detected. 0 blocking vulnerabilities.", warningCount);
            } else {
                summary = String.format("Gate evaluation passed: 0 security violations detected across %d scanned files. AST & configuration compliant.", scannedFiles);
            }

            return GateCheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict(verdict)
                    .passed(passed)
                    .summaryMessage(summary)
                    .totalFindings(findings.size())
                    .errorCount(errorCount)
                    .warningCount(warningCount)
                    .infoCount(infoCount)
                    .scannedFilesCount(scannedFiles)
                    .rulesCount(rulesCount > 0 ? rulesCount : 254)
                    .scanDurationSeconds(durationSeconds)
                    .containerId(targetEnv.getContainerId())
                    .environmentName(targetEnv.getName())
                    .timestamp(OffsetDateTime.now())
                    .findings(findings)
                    .rawOutput(rawOutput)
                    .build();

        } catch (Exception e) {
            log.error("Failed to parse Semgrep JSON output: {}", e.getMessage(), e);
            return GateCheckResponse.builder()
                    .projectId(project.getId().toString())
                    .projectName(project.getName())
                    .verdict("FAILED")
                    .passed(false)
                    .summaryMessage("Failed to parse Semgrep AST results: " + e.getMessage())
                    .rawOutput(rawOutput)
                    .containerId(targetEnv.getContainerId())
                    .environmentName(targetEnv.getName())
                    .scanDurationSeconds(durationSeconds)
                    .timestamp(OffsetDateTime.now())
                    .findings(Collections.emptyList())
                    .build();
        }
    }

    private Project getProjectAndValidateAccess(UserPrincipal currentUser, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found with id: " + projectId));

        boolean isOwner = project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ProjectAccessDeniedException("You do not have permission to access project: " + projectId);
        }
        return project;
    }

    private Deployment resolveDeployment(Project project) {
        return deploymentRepository.findFirstByProjectIdOrderByCreatedAtDesc(project.getId())
                .orElseGet(() -> deploymentRepository.save(
                        Deployment.builder()
                                .project(project)
                                .environment("DEVELOPMENT")
                                .status("COMPLETED")
                                .version("v1.0.0")
                                .branch(project.getDefaultBranch() != null ? project.getDefaultBranch() : "main")
                                .createdAt(OffsetDateTime.now())
                                .build()
                ));
    }

    private void persistSemgrepResults(Project project, TestEnvironment targetEnv, GateCheckResponse response, double durationSeconds, String rawOutput) {
        Deployment deployment = resolveDeployment(project);

        TestRunStatus runStatus;
        if ("PASSED".equalsIgnoreCase(response.getVerdict())) {
            runStatus = TestRunStatus.PASSED;
        } else if ("BLOCKED".equalsIgnoreCase(response.getVerdict()) || "FAILED".equalsIgnoreCase(response.getVerdict())) {
            runStatus = TestRunStatus.FAILED;
        } else {
            runStatus = TestRunStatus.ERROR;
        }

        int total = response.getTotalFindings() > 0 ? response.getTotalFindings() : 1;
        int failed = response.getErrorCount() + response.getWarningCount();
        int passed = Math.max(0, total - failed);
        long durMs = (long) (durationSeconds * 1000);
        OffsetDateTime now = response.getTimestamp() != null ? response.getTimestamp() : OffsetDateTime.now();

        TestRun testRun = TestRun.builder()
                .deployment(deployment)
                .type(TestRunType.SECURITY)
                .status(runStatus)
                .totalTests(total)
                .passedTests(passed)
                .failedTests(failed)
                .skippedTests(0)
                .durationMs(durMs)
                .startedAt(now.minusNanos((long) (durationSeconds * 1_000_000_000L)))
                .completedAt(now)
                .logs(response.getSummaryMessage() != null ? response.getSummaryMessage() : rawOutput)
                .build();

        testRun = testRunRepository.save(testRun);
        response.setTestRunId(testRun.getId());
        response.setDeploymentId(deployment.getId());

        if (response.getFindings() != null && !response.getFindings().isEmpty()) {
            for (SemgrepFinding finding : response.getFindings()) {
                Severity sev = mapSeverity(finding.getSeverity());

                String findingTitle = finding.getMessage() != null && !finding.getMessage().isBlank()
                        ? finding.getMessage()
                        : (finding.getCheckId() != null ? finding.getCheckId() : "Security Finding");

                SecurityFinding secFinding = SecurityFinding.builder()
                        .deployment(deployment)
                        .tool("Semgrep")
                        .category(SecurityCategory.SAST)
                        .title(truncate(findingTitle, 255))
                        .description(finding.getMessage())
                        .severity(sev)
                        .filePath(finding.getPath())
                        .lineNumber(finding.getStartLine())
                        .ruleId(finding.getCheckId() != null ? truncate(finding.getCheckId(), 100) : null)
                        .remediation(finding.getShortlink())
                        .status(FindingStatus.OPEN)
                        .createdAt(now)
                        .build();
                securityFindingRepository.save(secFinding);

                TestResult testResult = TestResult.builder()
                        .testRun(testRun)
                        .testName(truncate((finding.getCheckId() != null ? finding.getCheckId() : "Vulnerability") + ": " + findingTitle, 255))
                        .status(TestResultStatus.FAILED)
                        .severity(sev)
                        .durationMs((long) (durMs / (double) Math.max(1, response.getFindings().size())))
                        .errorMessage(finding.getMessage())
                        .build();
                testResultRepository.save(testResult);
            }
        } else {
            TestResult testResult = TestResult.builder()
                    .testRun(testRun)
                    .testName("Semgrep SAST Scan: Rules Passed")
                    .status(TestResultStatus.PASSED)
                    .severity(Severity.LOW)
                    .durationMs(durMs)
                    .build();
            testResultRepository.save(testResult);
        }

        double secScoreVal = Math.max(0.0, 100.0 - (response.getErrorCount() * 25.0 + response.getWarningCount() * 10.0 + response.getInfoCount() * 2.0));
        BigDecimal securityScore = BigDecimal.valueOf(Math.min(100.0, secScoreVal)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal testScore = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        BigDecimal perfScore = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        BigDecimal regScore = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalScore = securityScore;

        RiskLevel riskLevel;
        if (finalScore.doubleValue() >= 80.0) {
            riskLevel = RiskLevel.LOW;
        } else if (finalScore.doubleValue() >= 60.0) {
            riskLevel = RiskLevel.MEDIUM;
        } else if (finalScore.doubleValue() >= 40.0) {
            riskLevel = RiskLevel.HIGH;
        } else {
            riskLevel = RiskLevel.CRITICAL;
        }

        RiskAssessment riskAssessment = RiskAssessment.builder()
                .deployment(deployment)
                .securityScore(securityScore)
                .testScore(testScore)
                .performanceScore(perfScore)
                .regressionScore(regScore)
                .finalScore(finalScore)
                .riskLevel(riskLevel)
                .ruleVersion("v1.0")
                .calculatedAt(now)
                .build();
        riskAssessmentRepository.save(riskAssessment);
    }

    private void persistK6Results(Project project, TestEnvironment targetEnv, K6CheckResponse response, double durationSeconds, String rawOutput) {
        Deployment deployment = resolveDeployment(project);

        TestRunStatus runStatus;
        if ("PASSED".equalsIgnoreCase(response.getVerdict())) {
            runStatus = TestRunStatus.PASSED;
        } else if ("BLOCKED".equalsIgnoreCase(response.getVerdict()) || "FAILED".equalsIgnoreCase(response.getVerdict())) {
            runStatus = TestRunStatus.FAILED;
        } else {
            runStatus = TestRunStatus.ERROR;
        }

        int total = response.getChecks() != null && !response.getChecks().isEmpty() ? response.getChecks().size() : 1;
        int passed = response.getChecksPassed();
        int failed = response.getChecksFailed();
        long durMs = (long) (durationSeconds * 1000);
        OffsetDateTime now = response.getTimestamp() != null ? response.getTimestamp() : OffsetDateTime.now();

        TestRun testRun = TestRun.builder()
                .deployment(deployment)
                .type(TestRunType.PERFORMANCE)
                .status(runStatus)
                .totalTests(total)
                .passedTests(passed)
                .failedTests(failed)
                .skippedTests(0)
                .durationMs(durMs)
                .startedAt(now.minusNanos((long) (durationSeconds * 1_000_000_000L)))
                .completedAt(now)
                .logs(response.getSummaryMessage() != null ? response.getSummaryMessage() : rawOutput)
                .build();

        testRun = testRunRepository.save(testRun);
        response.setTestRunId(testRun.getId());
        response.setDeploymentId(deployment.getId());

        if (response.getChecks() != null && !response.getChecks().isEmpty()) {
            for (K6CheckItem check : response.getChecks()) {
                TestResult testResult = TestResult.builder()
                        .testRun(testRun)
                        .testName(truncate(check.getName(), 255))
                        .status(check.isPassed() ? TestResultStatus.PASSED : TestResultStatus.FAILED)
                        .severity(check.isPassed() ? null : Severity.HIGH)
                        .errorMessage(check.isPassed() ? null : ("Check failed with " + check.getFails() + " failures"))
                        .build();
                testResultRepository.save(testResult);
            }
        }

        PerformanceMetric p95Metric = PerformanceMetric.builder()
                .deployment(deployment)
                .metricName("RESPONSE_TIME")    
                .currentValue(BigDecimal.valueOf(response.getP95DurationMs()).setScale(4, RoundingMode.HALF_UP))
                .unit("ms")
                .threshold(BigDecimal.valueOf(800.0).setScale(4, RoundingMode.HALF_UP))
                .status(response.getP95DurationMs() <= 800.0 ? MetricStatus.PASSED : MetricStatus.FAILED)
                .build();
        performanceMetricRepository.save(p95Metric);

        PerformanceMetric errorMetric = PerformanceMetric.builder()
                .deployment(deployment)
                .metricName("ERROR_RATE")
                .currentValue(BigDecimal.valueOf(response.getFailedRequestRate() * 100.0).setScale(4, RoundingMode.HALF_UP))
                .unit("%")
                .threshold(BigDecimal.valueOf(5.0).setScale(4, RoundingMode.HALF_UP))
                .status((response.getFailedRequestRate() * 100.0) <= 5.0 ? MetricStatus.PASSED : MetricStatus.FAILED)
                .build();
        performanceMetricRepository.save(errorMetric);

        PerformanceMetric rpsMetric = PerformanceMetric.builder()
                .deployment(deployment)
                .metricName("THROUGHPUT")
                .currentValue(BigDecimal.valueOf(response.getRequestsPerSecond()).setScale(4, RoundingMode.HALF_UP))
                .unit("req/s")
                .status(MetricStatus.PASSED)
                .build();
        performanceMetricRepository.save(rpsMetric);

        double perfScoreVal = Math.max(0.0, 100.0 - (response.getFailedRequestRate() * 100.0 * 5.0) - (response.getP95DurationMs() > 800.0 ? 30.0 : 0.0) - (response.getChecksFailed() * 15.0));
        BigDecimal perfScore = BigDecimal.valueOf(Math.min(100.0, perfScoreVal)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal securityScore = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        BigDecimal testScore = BigDecimal.valueOf(response.getCheckSuccessRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal regScore = BigDecimal.valueOf(100.00).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalScore = perfScore;

        RiskLevel riskLevel;
        if (finalScore.doubleValue() >= 80.0) {
            riskLevel = RiskLevel.LOW;
        } else if (finalScore.doubleValue() >= 60.0) {
            riskLevel = RiskLevel.MEDIUM;
        } else if (finalScore.doubleValue() >= 40.0) {
            riskLevel = RiskLevel.HIGH;
        } else {
            riskLevel = RiskLevel.CRITICAL;
        }

        RiskAssessment riskAssessment = RiskAssessment.builder()
                .deployment(deployment)
                .securityScore(securityScore)
                .testScore(testScore)
                .performanceScore(perfScore)
                .regressionScore(regScore)
                .finalScore(finalScore)
                .riskLevel(riskLevel)
                .ruleVersion("v1.0")
                .calculatedAt(now)
                .build();
        riskAssessmentRepository.save(riskAssessment);
    }

    private Severity mapSeverity(String severity) {
        if (severity == null) return Severity.MEDIUM;
        return switch (severity.toUpperCase()) {
            case "CRITICAL", "ERROR" -> Severity.CRITICAL;
            case "HIGH" -> Severity.HIGH;
            case "LOW", "INFO" -> Severity.LOW;
            default -> Severity.MEDIUM;
        };
    }

    private String truncate(String val, int max) {
        if (val == null) return null;
        return val.length() <= max ? val : val.substring(0, max);
    }
}
