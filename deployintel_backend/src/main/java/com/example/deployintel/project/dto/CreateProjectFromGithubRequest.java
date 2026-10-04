package com.example.deployintel.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectFromGithubRequest(
        @NotBlank(message = "GitHub repository URL or full name (owner/repo) is required")
        String repository,

        @Size(max = 150, message = "Project name cannot exceed 150 characters")
        String name,

        String description,

        @Size(max = 100, message = "Default branch cannot exceed 100 characters")
        String defaultBranch,

        @Size(max = 50, message = "Language cannot exceed 50 characters")
        String language
) {}
