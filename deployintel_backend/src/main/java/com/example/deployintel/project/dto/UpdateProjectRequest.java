package com.example.deployintel.project.dto;

import com.example.deployintel.project.entity.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 150, message = "Project name cannot exceed 150 characters")
        String name,

        String description,

        @NotBlank(message = "Repository URL is required")
        String repositoryUrl,

        @NotBlank(message = "Default branch is required")
        @Size(max = 100, message = "Default branch cannot exceed 100 characters")
        String defaultBranch,

        @Size(max = 50, message = "Language cannot exceed 50 characters")
        String language,

        ProjectStatus status
) {}
