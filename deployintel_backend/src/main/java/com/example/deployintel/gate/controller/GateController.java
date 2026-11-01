package com.example.deployintel.gate.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.gate.dto.GateCheckResponse;
import com.example.deployintel.gate.dto.K6CheckResponse;
import com.example.deployintel.gate.service.GateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/gate")
@RequiredArgsConstructor
public class GateController {

    private final GateService gateService;

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
}
