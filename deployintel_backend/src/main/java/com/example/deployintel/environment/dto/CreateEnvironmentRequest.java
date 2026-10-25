package com.example.deployintel.environment.dto;

import java.util.Map;

public record CreateEnvironmentRequest(
        String name,
        String image,
        Integer port,
        Map<String, String> environmentVariables,
        String workspacePath,
        Boolean autoClone
) {}
