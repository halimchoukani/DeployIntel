package com.example.deployintel.environment.dto;

import com.example.deployintel.environment.entity.EnvironmentStatus;
import com.example.deployintel.environment.entity.TestEnvironment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record EnvironmentResponse(
        UUID id,
        UUID projectId,
        String name,
        String containerId,
        String containerName,
        String image,
        EnvironmentStatus status,
        String portMapping,
        String environmentVariables,
        String workspacePath,
        String errorMessage,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static EnvironmentResponse fromEntity(TestEnvironment env) {
        return new EnvironmentResponse(
                env.getId(),
                env.getProject() != null ? env.getProject().getId() : null,
                env.getName(),
                env.getContainerId(),
                env.getContainerName(),
                env.getImage(),
                env.getStatus(),
                env.getPortMapping(),
                env.getEnvironmentVariables(),
                env.getWorkspacePath(),
                env.getErrorMessage(),
                env.getCreatedAt(),
                env.getUpdatedAt()
        );
    }
}
