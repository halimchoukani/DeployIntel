package com.example.deployintel.gate.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.dto.TestRunHistoryResponse;
import com.example.deployintel.gate.service.GateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/gate")
@RequiredArgsConstructor
public class GateController {

    private final GateService gateService;

    /**
     * Retrieves test run history for the project, ordered by newest first.
     */
    @GetMapping("/history")
    public ResponseEntity<List<TestRunHistoryResponse>> getTestHistory(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        List<TestRunHistoryResponse> history = gateService.getTestHistoryForProject(principal, projectId);
        return ResponseEntity.ok(history);
    }

    /**
     * Executes the Semgrep security SAST gate evaluation on the project source code.
     */
    @PostMapping("/semgrep")
    public ResponseEntity<GateCheckResponse> runSemgrepGateCheck(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        GateCheckResponse response = gateService.runSemgrepCheck(principal, projectId);
        return ResponseEntity.ok(response);
    }

    /**
     * Executes the Grafana k6 performance load test gate evaluation on the project.
     */
    @PostMapping("/k6")
    public ResponseEntity<K6CheckResponse> runK6PerformanceCheck(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        K6CheckResponse response = gateService.runK6PerformanceCheck(principal, projectId);
        return ResponseEntity.ok(response);
    }

    /**
     * Generates or regenerates AI diagnostic suggestions from local Ollama for a specific test run.
     */
    @PostMapping("/runs/{testRunId}/ai-help")
    public ResponseEntity<TestRunHistoryResponse> generateAiHelpForRun(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID testRunId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        TestRunHistoryResponse response = gateService.generateAiHelpForRun(principal, projectId, testRunId);
        return ResponseEntity.ok(response);
    }
}
