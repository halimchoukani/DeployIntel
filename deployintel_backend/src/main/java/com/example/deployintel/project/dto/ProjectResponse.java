package com.example.deployintel.project.dto;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;
import com.example.deployintel.project.member.entity.ProjectPermission;
import com.example.deployintel.project.member.entity.ProjectRole;

import java.time.OffsetDateTime;
import java.util.Set;
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
        OffsetDateTime updatedAt,
        ProjectRole currentUserRole,
        Set<ProjectPermission> currentUserPermissions
) {
    public ProjectResponse(
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
        this(id, name, description, repositoryUrl, defaultBranch, language, ownerId, status, createdAt, updatedAt, null, Set.of());
    }

    public static ProjectResponse fromEntity(Project project) {
        return fromEntity(project, null, Set.of());
    }

    public static ProjectResponse fromEntity(Project project, ProjectRole role, Set<ProjectPermission> permissions) {
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
                project.getUpdatedAt(),
                role,
                permissions != null ? permissions : Set.of()
        );
    }
}
