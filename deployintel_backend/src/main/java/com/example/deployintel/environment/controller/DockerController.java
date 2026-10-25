package com.example.deployintel.environment.controller;

import com.example.deployintel.environment.dto.DockerDaemonInfoResponse;
import com.example.deployintel.environment.service.EnvironmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/docker")
@RequiredArgsConstructor
public class DockerController {

    private final EnvironmentService environmentService;

    /**
     * Checks the health and connection status of the host's Docker daemon.
     */
    @GetMapping("/status")
    public ResponseEntity<DockerDaemonInfoResponse> getDockerStatus() {
        return ResponseEntity.ok(environmentService.getDockerStatus());
    }
}
