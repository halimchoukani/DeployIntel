package com.example.deployintel.admin.dto;

import com.example.deployintel.project.entity.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateProjectStatusRequest(
        @NotNull(message = "Status is required")
        ProjectStatus status
) {
}
