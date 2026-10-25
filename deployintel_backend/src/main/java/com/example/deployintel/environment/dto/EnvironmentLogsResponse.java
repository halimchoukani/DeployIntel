package com.example.deployintel.environment.dto;

import java.util.UUID;

public record EnvironmentLogsResponse(
        UUID environmentId,
        String containerId,
        String logs
) {}
