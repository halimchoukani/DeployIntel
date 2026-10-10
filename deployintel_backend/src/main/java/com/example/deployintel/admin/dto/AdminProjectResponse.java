package com.example.deployintel.admin.dto;

import com.example.deployintel.project.entity.Project;
import com.example.deployintel.project.entity.ProjectStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AdminProjectResponse(
        UUID id,
        String name,
        String description,
        String repositoryUrl,
        String defaultBranch,
        String language,
        ProjectStatus status,
        UUID ownerId,
        String ownerEmail,
        String ownerName,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static AdminProjectResponse fromProject(Project project) {
        UUID ownerId = null;
        String ownerEmail = null;
        String ownerName = null;

        if (project.getOwner() != null) {
            ownerId = project.getOwner().getId();
            ownerEmail = project.getOwner().getEmail();
            String first = project.getOwner().getFirstName() != null ? project.getOwner().getFirstName() : "";
            String last = project.getOwner().getLastName() != null ? project.getOwner().getLastName() : "";
            ownerName = (first + " " + last).trim();
            if (ownerName.isEmpty()) {
                ownerName = ownerEmail;
            }
        }

        return new AdminProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getRepositoryUrl(),
                project.getDefaultBranch(),
                project.getLanguage(),
                project.getStatus(),
                ownerId,
                ownerEmail,
                ownerName,
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}
