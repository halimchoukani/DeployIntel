package com.example.deployintel.environment.controller;

import com.example.deployintel.auth.security.UserPrincipal;
import com.example.deployintel.environment.dto.*;
import com.example.deployintel.environment.service.EnvironmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/environments")
@RequiredArgsConstructor
public class TestEnvironmentController {

    private final EnvironmentService environmentService;

    /**
     * Creates and provisions a new Docker test environment container for the project.
     */
    @PostMapping
    public ResponseEntity<EnvironmentResponse> createEnvironment(
            Authentication authentication,
            @PathVariable UUID projectId,
            @RequestBody(required = false) CreateEnvironmentRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        CreateEnvironmentRequest req = request != null ? request : new CreateEnvironmentRequest(null, null, null, null, null, null);
        EnvironmentResponse response = environmentService.createEnvironment(principal, projectId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Lists all test environments for a given project.
     */
    @GetMapping
    public ResponseEntity<List<EnvironmentResponse>> getEnvironmentsForProject(
            Authentication authentication,
            @PathVariable UUID projectId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        List<EnvironmentResponse> responses = environmentService.getEnvironmentsByProject(principal, projectId);
        return ResponseEntity.ok(responses);
    }

    /**
     * Gets details and live status of a specific test environment.
     */
    @GetMapping("/{environmentId}")
    public ResponseEntity<EnvironmentResponse> getEnvironment(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID environmentId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        EnvironmentResponse response = environmentService.getEnvironmentById(principal, projectId, environmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Starts a stopped test environment container.
     */
    @PostMapping("/{environmentId}/start")
    public ResponseEntity<EnvironmentResponse> startEnvironment(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID environmentId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        EnvironmentResponse response = environmentService.startEnvironment(principal, projectId, environmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Stops a running test environment container.
     */
    @PostMapping("/{environmentId}/stop")
    public ResponseEntity<EnvironmentResponse> stopEnvironment(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID environmentId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        EnvironmentResponse response = environmentService.stopEnvironment(principal, projectId, environmentId);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes and cleans up a test environment and its Docker container.
     */
    @DeleteMapping("/{environmentId}")
    public ResponseEntity<Void> deleteEnvironment(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID environmentId
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        environmentService.deleteEnvironment(principal, projectId, environmentId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Fetches the console logs from the test container.
     */
    @GetMapping("/{environmentId}/logs")
    public ResponseEntity<EnvironmentLogsResponse> getEnvironmentLogs(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID environmentId,
            @RequestParam(defaultValue = "100") int tail
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        EnvironmentLogsResponse response = environmentService.getEnvironmentLogs(principal, projectId, environmentId, tail);
        return ResponseEntity.ok(response);
    }

    /**
     * Executes a command inside the test container workspace.
     */
    @PostMapping("/{environmentId}/exec")
    public ResponseEntity<CommandExecutionResponse> executeCommand(
            Authentication authentication,
            @PathVariable UUID projectId,
            @PathVariable UUID environmentId,
            @Valid @RequestBody ExecuteCommandRequest request
    ) {
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        CommandExecutionResponse response = environmentService.executeCommand(principal, projectId, environmentId, request);
        return ResponseEntity.ok(response);
    }
}
