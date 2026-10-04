package com.example.deployintel.project.dto;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String repositoryUrl,
        String defaultBranch,
        String language,
        UUID ownerId,
        ProjectStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static ProjectResponse fromEntity(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getRepositoryUrl(),
                project.getDefaultBranch(),
                project.getLanguage(),
                project.getOwner() != null ? project.getOwner().getId() : null,
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
