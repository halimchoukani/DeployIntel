package com.example.deployintel.environment.dto;

public record DockerDaemonInfoResponse(
        boolean connected,
        String dockerHost,
        String serverVersion,
        String operatingSystem,
        Integer totalContainers,
        String statusMessage
) {}
