package com.example.deployintel.environment.dto;

import java.util.Map;

public record CreateEnvironmentRequest(
        String name,
        String image,
        Integer port,
        Map<String, String> environmentVariables,
        String workspacePath,
        Boolean autoClone,
        Boolean installSemgrep
) {
    public CreateEnvironmentRequest(
            String name,
            String image,
            Integer port,
            Map<String, String> environmentVariables,
            String workspacePath,
            Boolean autoClone
    ) {
        this(name, image, port, environmentVariables, workspacePath, autoClone, true);
    }
}